import { createHash } from "node:crypto";

import { config } from "../../config/index.js";
import {
  DAY_IN_MS,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_CODE,
} from "../../constants/index.js";
import { AppError, PaymentError } from "../../errors/index.js";
import { logger } from "../../logger/index.js";
import {
  createCheckoutSession,
  createOrGetCustomer,
  createPaymentIntent,
  logAuditEvent,
  retrievePaymentIntent,
} from "../../services/index.js";
import { fromMinorUnits } from "../../utils/index.js";
import {
  buildDefaultContributionRule,
  calculateSubscriptionAllocationSplit,
} from "../charities/charity-accounting.js";
import {
  CHARITY_ALLOCATION_DIRECTIONS,
  CHARITY_ALLOCATION_ENTRY_TYPES,
  CHARITY_CURRENCIES,
  DONATION_SOURCES,
} from "../charities/charities.enums.js";
import { charitiesRepository } from "../charities/charities.repository.js";
import {
  SUBSCRIPTION_HISTORY_EVENT_TYPES,
  SUBSCRIPTION_STATUSES as DOMAIN_SUBSCRIPTION_STATUSES,
} from "../subscriptions/subscriptions.enums.js";
import { subscriptionsRepository } from "../subscriptions/subscriptions.repository.js";
import { usersRepository } from "../users/users.repository.js";
import { NOTIFICATION_EVENT_TYPES } from "../notifications/notifications.enums.js";
import { dispatchNotificationEvent } from "../notifications/notifications.dispatcher.js";

import {
  PAYMENT_LEDGER_ENTRY_TYPES,
  PAYMENT_STATES,
  PAYMENT_TERMINAL_STATES,
  STRIPE_WEBHOOK_EVENT_STATUSES,
} from "./payments.enums.js";
import {
  mapDomainSubscriptionStatusToUserSubscriptionState,
  mapPaymentLedgerDirection,
  mapPaymentStateToDonationStatus,
  mapPaymentStateToLedgerEntryType,
} from "./payments.mappers.js";
import { paymentsRepository } from "./payments.repository.js";

const reconciliationLogger = logger.child({ scope: "payments-reconciliation" });
const paymentNotificationStates = new Set([
  PAYMENT_STATES.SUCCEEDED,
  PAYMENT_STATES.FAILED,
  PAYMENT_STATES.CANCELED,
  PAYMENT_STATES.TIMEOUT,
  PAYMENT_STATES.RETRY_REQUIRED,
]);

const nowDate = () => new Date();

const mapPaymentStateToNotificationEvent = (state) => {
  if (state === PAYMENT_STATES.SUCCEEDED) {
    return NOTIFICATION_EVENT_TYPES.PAYMENT_SUCCESS;
  }

  if (
    [
      PAYMENT_STATES.FAILED,
      PAYMENT_STATES.CANCELED,
      PAYMENT_STATES.TIMEOUT,
      PAYMENT_STATES.RETRY_REQUIRED,
    ].includes(state)
  ) {
    return NOTIFICATION_EVENT_TYPES.PAYMENT_FAILURE;
  }

  return null;
};

const notifyPaymentStateTransition = async ({
  previousPayment,
  updatedPayment,
  requestContext = {},
}) => {
  if (!updatedPayment?.userId) {
    return null;
  }

  if (!paymentNotificationStates.has(updatedPayment.state)) {
    return null;
  }

  if (
    previousPayment?.state === updatedPayment.state &&
    updatedPayment.state !== PAYMENT_STATES.RETRY_REQUIRED
  ) {
    return null;
  }

  const eventType = mapPaymentStateToNotificationEvent(updatedPayment.state);

  if (!eventType) {
    return null;
  }

  dispatchNotificationEvent({
    scope: "payments",
    userId: updatedPayment.userId,
    eventType,
    context: {
      paymentId: updatedPayment.id,
      paymentIntentId: updatedPayment.stripePaymentIntentId,
      amountMinor: updatedPayment.amount,
      amountMajor: updatedPayment.amountMajor,
      currency: String(
        updatedPayment.currency || DEFAULT_CURRENCY_CODE,
      ).toUpperCase(),
      reason: updatedPayment.stateReason || "",
      state: updatedPayment.state,
    },
    dedupeKey: `payment:${updatedPayment.id}:state:${updatedPayment.state}`,
    requestContext,
  });

  return null;
};

const withProcessingTimeout = async (promise, timeoutMs) => {
  let timer = null;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new PaymentError(
              `Webhook processing exceeded timeout of ${timeoutMs}ms.`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const amountMajorFromMinor = (amountMinor) => fromMinorUnits(amountMinor, 2);

const toLowerCurrency = (currency) => String(currency || "").toLowerCase();

const toStripeMetadata = (metadata = {}) => {
  return Object.entries(metadata).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null) {
      return accumulator;
    }

    accumulator[String(key)] = String(value);
    return accumulator;
  }, {});
};

const createLedgerIdempotencyKey = ({
  paymentId,
  source,
  stripeEventId,
  status,
  runAt,
  custom,
}) => {
  if (custom) {
    return custom;
  }

  if (source === "webhook") {
    return `stripe:${stripeEventId}:${status}:${paymentId}`;
  }

  if (source === "timeout") {
    return `timeout:${paymentId}:${runAt?.toISOString?.() || nowDate().toISOString()}`;
  }

  return `payment:${paymentId}:${status}`;
};

const normalizeStripeEvent = (event) => {
  const stripeObject = event?.data?.object;

  if (!stripeObject || typeof stripeObject !== "object") {
    return null;
  }

  if (stripeObject.object === "payment_intent") {
    const statusFromIntent = String(stripeObject.status || "").toLowerCase();

    let desiredState = PAYMENT_STATES.PROCESSING;

    if (statusFromIntent === "succeeded") {
      desiredState = PAYMENT_STATES.SUCCEEDED;
    } else if (statusFromIntent === "canceled") {
      desiredState = PAYMENT_STATES.CANCELED;
    } else if (
      statusFromIntent === "requires_payment_method" ||
      statusFromIntent === "requires_action"
    ) {
      desiredState = PAYMENT_STATES.RETRY_REQUIRED;
    } else if (event.type === "payment_intent.payment_failed") {
      desiredState = PAYMENT_STATES.FAILED;
    } else if (
      statusFromIntent === "processing" ||
      statusFromIntent === "requires_capture"
    ) {
      desiredState = PAYMENT_STATES.PROCESSING;
    }

    return {
      sourceKind: "payment_intent",
      paymentIntentId: stripeObject.id,
      desiredState,
      declaredAmountMinor: Number.isInteger(stripeObject.amount)
        ? stripeObject.amount
        : null,
      receivedAmountMinor: Number.isInteger(stripeObject.amount_received)
        ? stripeObject.amount_received
        : null,
      currency: stripeObject.currency
        ? String(stripeObject.currency).toLowerCase()
        : "",
      statusReason: event.type,
      metadata: stripeObject.metadata || {},
      stripeObjectId: stripeObject.id,
      occurredAt: stripeObject.created
        ? new Date(stripeObject.created * 1000)
        : nowDate(),
    };
  }

  if (stripeObject.object === "checkout.session") {
    const paymentIntentId =
      typeof stripeObject.payment_intent === "string"
        ? stripeObject.payment_intent
        : null;

    if (!paymentIntentId) {
      return {
        sourceKind: "checkout.session",
        paymentIntentId: null,
        desiredState: PAYMENT_STATES.PROCESSING,
        declaredAmountMinor: null,
        receivedAmountMinor: null,
        currency: stripeObject.currency
          ? String(stripeObject.currency).toLowerCase()
          : "",
        statusReason: event.type,
        metadata: stripeObject.metadata || {},
        stripeObjectId: stripeObject.id,
        occurredAt: stripeObject.created
          ? new Date(stripeObject.created * 1000)
          : nowDate(),
      };
    }

    let desiredState = PAYMENT_STATES.PROCESSING;

    if (event.type === "checkout.session.async_payment_succeeded") {
      desiredState = PAYMENT_STATES.SUCCEEDED;
    } else if (event.type === "checkout.session.async_payment_failed") {
      desiredState = PAYMENT_STATES.FAILED;
    } else if (event.type === "checkout.session.expired") {
      desiredState = PAYMENT_STATES.CANCELED;
    } else if (
      event.type === "checkout.session.completed" &&
      String(stripeObject.payment_status || "").toLowerCase() === "paid"
    ) {
      desiredState = PAYMENT_STATES.SUCCEEDED;
    }

    return {
      sourceKind: "checkout.session",
      paymentIntentId,
      desiredState,
      declaredAmountMinor: Number.isInteger(stripeObject.amount_total)
        ? stripeObject.amount_total
        : null,
      receivedAmountMinor: null,
      currency: stripeObject.currency
        ? String(stripeObject.currency).toLowerCase()
        : "",
      statusReason: event.type,
      metadata: stripeObject.metadata || {},
      stripeObjectId: stripeObject.id,
      occurredAt: stripeObject.created
        ? new Date(stripeObject.created * 1000)
        : nowDate(),
    };
  }

  return null;
};

const resolveNextState = ({ currentState, incomingState }) => {
  if (!incomingState) {
    return currentState;
  }

  if (incomingState === PAYMENT_STATES.SUCCEEDED) {
    return PAYMENT_STATES.SUCCEEDED;
  }

  if (
    currentState === PAYMENT_STATES.SUCCEEDED &&
    incomingState !== PAYMENT_STATES.SUCCEEDED
  ) {
    return currentState;
  }

  if (incomingState === PAYMENT_STATES.PROCESSING) {
    if (
      [
        PAYMENT_STATES.PROCESSING,
        PAYMENT_STATES.RETRY_REQUIRED,
        PAYMENT_STATES.TIMEOUT,
      ].includes(currentState)
    ) {
      return PAYMENT_STATES.PROCESSING;
    }

    return currentState;
  }

  if (incomingState === PAYMENT_STATES.TIMEOUT) {
    if (
      [PAYMENT_STATES.PROCESSING, PAYMENT_STATES.RETRY_REQUIRED].includes(
        currentState,
      )
    ) {
      return PAYMENT_STATES.TIMEOUT;
    }

    return currentState;
  }

  if (
    [
      PAYMENT_STATES.FAILED,
      PAYMENT_STATES.CANCELED,
      PAYMENT_STATES.RETRY_REQUIRED,
    ].includes(incomingState)
  ) {
    if (
      [
        PAYMENT_STATES.PROCESSING,
        PAYMENT_STATES.RETRY_REQUIRED,
        PAYMENT_STATES.TIMEOUT,
      ].includes(currentState)
    ) {
      return incomingState;
    }

    return currentState;
  }

  return currentState;
};

const buildSubscriptionBillingWindow = ({ startAt, billingCycleDays }) => {
  const start = startAt || nowDate();
  const end = new Date(start.getTime() + billingCycleDays * DAY_IN_MS);

  return {
    startAt: start,
    endAt: end,
    nextBillingAt: end,
  };
};

const appendLedgerEntry = async ({
  payment,
  entryType,
  source,
  stripeEventId,
  stripeEventType,
  idempotencyKey,
  runAt,
  occurredAt,
  metadata = {},
}) => {
  const resolvedIdempotencyKey = createLedgerIdempotencyKey({
    paymentId: payment.id,
    source,
    stripeEventId,
    status: entryType,
    runAt,
    custom: idempotencyKey,
  });

  const existing = await paymentsRepository.findLedgerEntryByIdempotencyKey(
    resolvedIdempotencyKey,
  );

  if (existing) {
    return existing;
  }

  try {
    return await paymentsRepository.createLedgerEntry({
      paymentId: payment.id,
      userId: payment.userId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeEventId: stripeEventId || "",
      idempotencyKey: resolvedIdempotencyKey,
      entryType,
      direction: mapPaymentLedgerDirection(entryType),
      amountMinor: payment.amount,
      amountMajor: payment.amountMajor,
      currency: payment.currency,
      occurredAt: occurredAt || nowDate(),
      metadata: {
        source,
        stripeEventType: stripeEventType || "",
        ...metadata,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return paymentsRepository.findLedgerEntryByIdempotencyKey(
        resolvedIdempotencyKey,
      );
    }

    throw error;
  }
};

const appendCharityAllocationEntry = async ({
  idempotencyKey,
  payment,
  entryType,
  direction,
  amountMinor,
  charityId = null,
  subscriptionId = null,
  donationId = null,
  percentageApplied = null,
  occurredAt = nowDate(),
  metadata = {},
}) => {
  if (Number(amountMinor || 0) <= 0) {
    return null;
  }

  const existing =
    await charitiesRepository.findAllocationLedgerByIdempotencyKey(
      idempotencyKey,
    );

  if (existing) {
    return existing;
  }

  try {
    return await charitiesRepository.createAllocationLedgerEntry({
      idempotencyKey,
      paymentId: payment.id,
      userId: payment.userId,
      charityId,
      subscriptionId,
      donationId,
      entryType,
      direction,
      currency: CHARITY_CURRENCIES.INR,
      amountMinor: Number(amountMinor),
      amountMajor: fromMinorUnits(Number(amountMinor), 2),
      percentageApplied,
      occurredAt,
      metadata,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return charitiesRepository.findAllocationLedgerByIdempotencyKey(
        idempotencyKey,
      );
    }

    throw error;
  }
};

const reserveWebhookEvent = async ({
  event,
  payloadHash,
  normalizedPayload,
}) => {
  try {
    const created = await paymentsRepository.createWebhookEvent({
      stripeEventId: event.id,
      eventType: event.type,
      paymentIntentId: normalizedPayload?.paymentIntentId || "",
      stripeObjectId: normalizedPayload?.stripeObjectId || "",
      livemode: Boolean(event.livemode),
      apiVersion: event.api_version || "",
      status: STRIPE_WEBHOOK_EVENT_STATUSES.PROCESSING,
      processingAttempts: 1,
      firstReceivedAt: nowDate(),
      lastReceivedAt: nowDate(),
      payloadHash,
      metadata: {},
    });

    return {
      webhookRecord: created,
      duplicate: false,
    };
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    const existing = await paymentsRepository.findWebhookEventByStripeEventId(
      event.id,
    );

    if (!existing) {
      throw error;
    }

    if (
      [
        STRIPE_WEBHOOK_EVENT_STATUSES.PROCESSED,
        STRIPE_WEBHOOK_EVENT_STATUSES.IGNORED,
      ].includes(existing.status)
    ) {
      return {
        webhookRecord: existing,
        duplicate: true,
      };
    }

    const processing = await paymentsRepository.markWebhookEventProcessing(
      existing.id,
      {
        ...(existing.metadata || {}),
        replay: true,
      },
    );

    return {
      webhookRecord: processing,
      duplicate: false,
    };
  }
};

const syncUserSubscriptionStatus = async (userId, subscriptionStatus) => {
  const mappedStatus = mapDomainSubscriptionStatusToUserSubscriptionState(
    subscriptionStatus,
    { pendingPaymentAsPastDue: true },
  );

  await usersRepository.updateById(userId, {
    subscriptionStatus: mappedStatus,
  });

  return mappedStatus;
};

const reconcileSubscriptionForPayment = async ({
  payment,
  stripeEventId,
  stripeEventType,
  source,
}) => {
  const subscription = await subscriptionsRepository.findByPaymentIntentId(
    payment.stripePaymentIntentId,
  );

  if (!subscription) {
    return {
      handled: false,
      reason: "subscription_not_found",
    };
  }

  if (payment.state === PAYMENT_STATES.SUCCEEDED) {
    if (subscription.status === DOMAIN_SUBSCRIPTION_STATUSES.ACTIVE) {
      return {
        handled: false,
        reason: "already_active",
      };
    }

    const plan = await subscriptionsRepository.findPlanById(
      subscription.planId,
    );

    if (!plan) {
      return {
        handled: false,
        reason: "plan_missing",
      };
    }

    const billingWindow = buildSubscriptionBillingWindow({
      startAt: nowDate(),
      billingCycleDays: plan.billingCycleDays,
    });

    const updated = await subscriptionsRepository.updateSubscriptionById(
      subscription.id,
      {
        status: DOMAIN_SUBSCRIPTION_STATUSES.ACTIVE,
        startAt: billingWindow.startAt,
        endAt: billingWindow.endAt,
        nextBillingAt: billingWindow.nextBillingAt,
        gracePeriodEndsAt: null,
        lastPaymentStatus: PAYMENT_STATES.SUCCEEDED,
        metadata: {
          ...(subscription.metadata || {}),
          webhookSettlement: {
            stripeEventId,
            stripeEventType,
            source,
            settledAt: nowDate(),
          },
        },
      },
    );

    await subscriptionsRepository.createHistory({
      subscriptionId: updated.id,
      userId: updated.userId,
      eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.PAYMENT_CONFIRMED,
      previousStatus: subscription.status,
      nextStatus: updated.status,
      previousPlanCode: updated.planCode,
      nextPlanCode: updated.planCode,
      actorId: null,
      metadata: {
        stripeEventId,
        stripeEventType,
        paymentIntentId: payment.stripePaymentIntentId,
      },
      occurredAt: nowDate(),
    });

    if (updated.latestCouponCode) {
      const coupon = await subscriptionsRepository.findCouponByCode(
        updated.latestCouponCode,
      );

      if (coupon) {
        await subscriptionsRepository.incrementCouponRedemption(coupon.id);
      }
    }

    await syncUserSubscriptionStatus(updated.userId, updated.status);

    return {
      handled: true,
      subscription: updated,
    };
  }

  if (
    [
      PAYMENT_STATES.FAILED,
      PAYMENT_STATES.CANCELED,
      PAYMENT_STATES.TIMEOUT,
      PAYMENT_STATES.RETRY_REQUIRED,
    ].includes(payment.state)
  ) {
    if (subscription.status !== DOMAIN_SUBSCRIPTION_STATUSES.PENDING_PAYMENT) {
      return {
        handled: false,
        reason: "status_not_pending_payment",
      };
    }

    const updated = await subscriptionsRepository.updateSubscriptionById(
      subscription.id,
      {
        status: DOMAIN_SUBSCRIPTION_STATUSES.PAYMENT_FAILED,
        lastPaymentStatus: payment.state,
        metadata: {
          ...(subscription.metadata || {}),
          webhookFailure: {
            stripeEventId,
            stripeEventType,
            source,
            state: payment.state,
            happenedAt: nowDate(),
          },
        },
      },
    );

    await subscriptionsRepository.createHistory({
      subscriptionId: updated.id,
      userId: updated.userId,
      eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.PAYMENT_FAILED,
      previousStatus: subscription.status,
      nextStatus: updated.status,
      previousPlanCode: updated.planCode,
      nextPlanCode: updated.planCode,
      actorId: null,
      metadata: {
        stripeEventId,
        stripeEventType,
        paymentIntentId: payment.stripePaymentIntentId,
        paymentState: payment.state,
      },
      occurredAt: nowDate(),
    });

    await syncUserSubscriptionStatus(updated.userId, updated.status);

    return {
      handled: true,
      subscription: updated,
    };
  }

  return {
    handled: false,
    reason: "state_not_applicable",
  };
};

const resolveAllocationSnapshotFromPayment = async (payment) => {
  const allocationSnapshot = payment.metadata?.allocationSnapshot || {};
  const defaultRule = buildDefaultContributionRule();
  const persistedRule = await charitiesRepository.getContributionRule(
    CHARITY_CURRENCIES.INR,
  );

  return {
    gatewayFeePercentage: Number(
      allocationSnapshot.gatewayFeePercentage ??
        persistedRule?.gatewayFeePercentage ??
        config.charity.gatewayFeePercentage ??
        defaultRule.gatewayFeePercentage,
    ),
    prizePoolPercentage: Number(
      allocationSnapshot.prizePoolPercentage ??
        persistedRule?.prizePoolPercentage ??
        config.charity.prizePoolPercentage ??
        defaultRule.prizePoolPercentage,
    ),
    mandatoryCharityPercentage: Number(
      allocationSnapshot.mandatoryCharityPercentage ??
        persistedRule?.mandatoryCharityPercentage ??
        config.charity.mandatoryCharityPercentage ??
        defaultRule.mandatoryCharityPercentage,
    ),
  };
};

const ensureSubscriptionAddonDonationRecord = async ({
  payment,
  subscriptionId,
  charityId,
  addonAmountMinor,
  donationStatus,
}) => {
  if (!addonAmountMinor || addonAmountMinor <= 0 || !charityId) {
    return null;
  }

  let donation = await charitiesRepository.findDonationByPaymentIntentId(
    payment.stripePaymentIntentId,
  );

  if (!donation) {
    donation = await charitiesRepository.createDonation({
      userId: payment.userId,
      charityId,
      paymentId: payment.id,
      paymentIntentId: payment.stripePaymentIntentId,
      subscriptionId,
      source: DONATION_SOURCES.SUBSCRIPTION_ADDON,
      currency: CHARITY_CURRENCIES.INR,
      amountMinor: addonAmountMinor,
      amountMajor: fromMinorUnits(addonAmountMinor, 2),
      status: donationStatus,
      finalizedAt: [
        DONATION_STATUSES.SUCCEEDED,
        DONATION_STATUSES.FAILED,
        DONATION_STATUSES.CANCELLED,
        DONATION_STATUSES.TIMEOUT,
      ].includes(donationStatus)
        ? nowDate()
        : null,
      userMessage: "",
      metadata: {
        origin: "subscription_optional_addon",
      },
    });

    return donation;
  }

  const updated = await charitiesRepository.updateDonationById(donation.id, {
    status: donationStatus,
    finalizedAt: [
      DONATION_STATUSES.SUCCEEDED,
      DONATION_STATUSES.FAILED,
      DONATION_STATUSES.CANCELLED,
      DONATION_STATUSES.TIMEOUT,
    ].includes(donationStatus)
      ? nowDate()
      : donation.finalizedAt,
  });

  return updated;
};

const reconcileCharityForSubscriptionPayment = async ({
  payment,
  stripeEventId,
  stripeEventType,
}) => {
  const subscription = await subscriptionsRepository.findByPaymentIntentId(
    payment.stripePaymentIntentId,
  );

  if (!subscription) {
    return {
      handled: false,
      reason: "subscription_not_found",
    };
  }

  const totalMinor = Math.max(Number(payment.amount || 0), 0);
  let optionalDonationMinor = Math.max(
    Number(payment.metadata?.optionalDonationMinor || 0),
    0,
  );

  if (optionalDonationMinor > totalMinor) {
    optionalDonationMinor = totalMinor;
  }

  let subscriptionBaseMinor = Number(payment.metadata?.subscriptionBaseMinor);

  if (!Number.isFinite(subscriptionBaseMinor) || subscriptionBaseMinor < 0) {
    subscriptionBaseMinor = Math.max(totalMinor - optionalDonationMinor, 0);
  }

  if (subscriptionBaseMinor + optionalDonationMinor > totalMinor) {
    subscriptionBaseMinor = Math.max(totalMinor - optionalDonationMinor, 0);
  }

  const charityId =
    payment.metadata?.charityId || subscription.charityId || null;
  const donationStatus = mapPaymentStateToDonationStatus(payment.state);

  const addonDonation = await ensureSubscriptionAddonDonationRecord({
    payment,
    subscriptionId: subscription.id,
    charityId,
    addonAmountMinor: optionalDonationMinor,
    donationStatus,
  });

  if (payment.state !== PAYMENT_STATES.SUCCEEDED) {
    return {
      handled: addonDonation !== null,
      reason: "payment_not_succeeded",
      donationId: addonDonation?.id || null,
    };
  }

  const snapshot = await resolveAllocationSnapshotFromPayment(payment);

  const split = calculateSubscriptionAllocationSplit({
    subscriptionBaseMinor,
    optionalDonationMinor,
    gatewayFeePercentage: snapshot.gatewayFeePercentage,
    prizePoolPercentage: snapshot.prizePoolPercentage,
    mandatoryCharityPercentage: snapshot.mandatoryCharityPercentage,
  });

  await appendCharityAllocationEntry({
    idempotencyKey: `charity-allocation:${payment.id}:gateway_fee`,
    payment,
    entryType: CHARITY_ALLOCATION_ENTRY_TYPES.GATEWAY_FEE,
    direction: CHARITY_ALLOCATION_DIRECTIONS.DEBIT,
    amountMinor: split.allocations.gatewayFeeMinor,
    subscriptionId: subscription.id,
    occurredAt: nowDate(),
    percentageApplied: snapshot.gatewayFeePercentage,
    metadata: {
      stripeEventId,
      stripeEventType,
    },
  });

  await appendCharityAllocationEntry({
    idempotencyKey: `charity-allocation:${payment.id}:prize_pool`,
    payment,
    entryType: CHARITY_ALLOCATION_ENTRY_TYPES.PRIZE_POOL,
    direction: CHARITY_ALLOCATION_DIRECTIONS.CREDIT,
    amountMinor: split.allocations.prizePoolMinor,
    subscriptionId: subscription.id,
    occurredAt: nowDate(),
    percentageApplied: snapshot.prizePoolPercentage,
    metadata: {
      stripeEventId,
      stripeEventType,
    },
  });

  await appendCharityAllocationEntry({
    idempotencyKey: `charity-allocation:${payment.id}:mandatory_charity`,
    payment,
    entryType: CHARITY_ALLOCATION_ENTRY_TYPES.MANDATORY_CHARITY,
    direction: CHARITY_ALLOCATION_DIRECTIONS.CREDIT,
    amountMinor: split.allocations.mandatoryCharityMinor,
    charityId: charityId || null,
    subscriptionId: subscription.id,
    occurredAt: nowDate(),
    percentageApplied: snapshot.mandatoryCharityPercentage,
    metadata: {
      stripeEventId,
      stripeEventType,
    },
  });

  await appendCharityAllocationEntry({
    idempotencyKey: `charity-allocation:${payment.id}:optional_addon`,
    payment,
    entryType: CHARITY_ALLOCATION_ENTRY_TYPES.OPTIONAL_CHARITY_ADDON,
    direction: CHARITY_ALLOCATION_DIRECTIONS.CREDIT,
    amountMinor: split.allocations.optionalCharityAddonMinor,
    charityId: charityId || null,
    subscriptionId: subscription.id,
    donationId: addonDonation?.id || null,
    occurredAt: nowDate(),
    percentageApplied: null,
    metadata: {
      stripeEventId,
      stripeEventType,
    },
  });

  await appendCharityAllocationEntry({
    idempotencyKey: `charity-allocation:${payment.id}:platform_revenue`,
    payment,
    entryType: CHARITY_ALLOCATION_ENTRY_TYPES.PLATFORM_REVENUE,
    direction: CHARITY_ALLOCATION_DIRECTIONS.CREDIT,
    amountMinor: split.allocations.platformRevenueMinor,
    subscriptionId: subscription.id,
    occurredAt: nowDate(),
    percentageApplied: null,
    metadata: {
      stripeEventId,
      stripeEventType,
    },
  });

  return {
    handled: true,
    split,
    donationId: addonDonation?.id || null,
  };
};

const reconcileCharityForIndependentDonation = async ({
  payment,
  stripeEventId,
  stripeEventType,
}) => {
  const metadataCharityId =
    payment.metadata?.charityId || payment.sourceEntityId || null;

  if (!metadataCharityId) {
    return {
      handled: false,
      reason: "charity_not_set",
    };
  }

  const donationStatus = mapPaymentStateToDonationStatus(payment.state);
  let donation = await charitiesRepository.findDonationByPaymentIntentId(
    payment.stripePaymentIntentId,
  );

  if (!donation) {
    donation = await charitiesRepository.createDonation({
      userId: payment.userId,
      charityId: metadataCharityId,
      paymentId: payment.id,
      paymentIntentId: payment.stripePaymentIntentId,
      source: DONATION_SOURCES.INDEPENDENT,
      currency: CHARITY_CURRENCIES.INR,
      amountMinor: payment.amount,
      amountMajor: payment.amountMajor,
      status: donationStatus,
      finalizedAt: [
        DONATION_STATUSES.SUCCEEDED,
        DONATION_STATUSES.FAILED,
        DONATION_STATUSES.CANCELLED,
        DONATION_STATUSES.TIMEOUT,
      ].includes(donationStatus)
        ? nowDate()
        : null,
      userMessage: "",
      metadata: {
        source: "webhook_reconstruction",
      },
    });
  } else {
    donation = await charitiesRepository.updateDonationById(donation.id, {
      status: donationStatus,
      finalizedAt: [
        DONATION_STATUSES.SUCCEEDED,
        DONATION_STATUSES.FAILED,
        DONATION_STATUSES.CANCELLED,
        DONATION_STATUSES.TIMEOUT,
      ].includes(donationStatus)
        ? nowDate()
        : donation.finalizedAt,
    });
  }

  if (payment.state !== PAYMENT_STATES.SUCCEEDED) {
    return {
      handled: true,
      reason: "payment_not_succeeded",
      donationId: donation.id,
    };
  }

  await appendCharityAllocationEntry({
    idempotencyKey: `charity-allocation:${payment.id}:independent_donation`,
    payment,
    entryType: CHARITY_ALLOCATION_ENTRY_TYPES.INDEPENDENT_DONATION_CHARITY,
    direction: CHARITY_ALLOCATION_DIRECTIONS.CREDIT,
    amountMinor: payment.amount,
    charityId: donation.charityId,
    donationId: donation.id,
    occurredAt: nowDate(),
    metadata: {
      stripeEventId,
      stripeEventType,
    },
  });

  return {
    handled: true,
    donationId: donation.id,
  };
};

const reconcileCharityAccountingForPayment = async ({
  payment,
  stripeEventId,
  stripeEventType,
}) => {
  if (payment.sourceDomain === "subscription") {
    return reconcileCharityForSubscriptionPayment({
      payment,
      stripeEventId,
      stripeEventType,
    });
  }

  if (payment.sourceDomain === "charity_donation") {
    return reconcileCharityForIndependentDonation({
      payment,
      stripeEventId,
      stripeEventType,
    });
  }

  return {
    handled: false,
    reason: "source_domain_not_supported",
  };
};

const updatePaymentState = async ({
  payment,
  incomingState,
  stateReason,
  stripeEventId = "",
  stripeEventType = "",
  stripeEventAt = null,
  mismatchDetected = false,
  mismatchReason = "",
  metadata = {},
}) => {
  const nextState = resolveNextState({
    currentState: payment.state,
    incomingState,
  });

  const shouldIncrementRetry =
    nextState === PAYMENT_STATES.RETRY_REQUIRED &&
    payment.state !== PAYMENT_STATES.RETRY_REQUIRED;

  const updatePayload = {
    state: nextState,
    stateReason: stateReason || payment.stateReason || "",
    stripeLastEventId: stripeEventId || payment.stripeLastEventId,
    stripeLastEventType: stripeEventType || payment.stripeLastEventType,
    stripeLastEventAt: stripeEventAt || nowDate(),
    mismatchDetected: Boolean(mismatchDetected || payment.mismatchDetected),
    retryCount: shouldIncrementRetry
      ? (payment.retryCount || 0) + 1
      : payment.retryCount || 0,
    metadata: {
      ...(payment.metadata || {}),
      ...metadata,
      mismatchReason: mismatchReason || payment.metadata?.mismatchReason || "",
    },
  };

  if (PAYMENT_TERMINAL_STATES.includes(nextState)) {
    updatePayload.finalizedAt = nowDate();
  }

  return paymentsRepository.updateById(payment.id, updatePayload);
};

const verifyWebhookAmountAndCurrency = ({ payment, normalizedPayload }) => {
  const declaredAmount = normalizedPayload.declaredAmountMinor;
  const normalizedCurrency = toLowerCurrency(normalizedPayload.currency);

  const amountMismatch =
    Number.isInteger(declaredAmount) && declaredAmount !== payment.amount;
  const currencyMismatch =
    normalizedCurrency &&
    normalizedCurrency !== toLowerCurrency(payment.currency);

  return {
    isMismatch: amountMismatch || currencyMismatch,
    amountMismatch,
    currencyMismatch,
  };
};

export const paymentsService = {
  async createPaymentIntentForUser(userId, payload, requestContext = {}) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw AppError.notFound("User not found.");
    }

    const customer = await createOrGetCustomer({
      email: user.email,
      name: user.displayName,
      metadata: {
        userId: user.id,
      },
    });

    const paymentIntent = await createPaymentIntent({
      amount: payload.amount,
      currency: payload.currency,
      customerId: customer.id,
      metadata: toStripeMetadata({
        userId: user.id,
        sourceDomain: payload.sourceDomain || "",
        sourceEntityId: payload.sourceEntityId || "",
        sourceAction: payload.sourceAction || "",
        ...(payload.metadata || {}),
      }),
    });

    const timeoutAt = new Date(
      nowDate().getTime() + config.payments.attemptTimeoutMinutes * 60 * 1000,
    );

    const created = await paymentsRepository.create({
      userId,
      amount: payload.amount,
      amountMajor: amountMajorFromMinor(payload.amount),
      currency: (
        payload.currency ||
        paymentIntent.currency ||
        DEFAULT_CURRENCY
      ).toLowerCase(),
      description: payload.description || "",
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
      stripeCheckoutSessionId: null,
      state: PAYMENT_STATES.PROCESSING,
      stateReason: "intent_created",
      sourceDomain: payload.sourceDomain || "",
      sourceEntityId: payload.sourceEntityId || "",
      sourceAction: payload.sourceAction || "",
      attemptCount: 1,
      retryCount: 0,
      timeoutAt,
      finalizedAt: null,
      stripeLastEventId: "",
      stripeLastEventType: "",
      stripeLastEventAt: null,
      mismatchDetected: false,
      metadata: payload.metadata || {},
    });

    await appendLedgerEntry({
      payment: created,
      entryType: PAYMENT_LEDGER_ENTRY_TYPES.INTENT_CREATED,
      source: "api",
      idempotencyKey: `payment:${created.id}:intent_created`,
      metadata: {
        requestId: requestContext.requestId || null,
      },
    });

    logAuditEvent({
      action: "payments.intent.create",
      actorId: userId,
      actorRole: requestContext.role,
      entity: "Payment",
      entityId: created.id,
      requestId: requestContext.requestId,
      metadata: {
        amount: payload.amount,
        currency: payload.currency,
        sourceDomain: payload.sourceDomain || "",
        sourceEntityId: payload.sourceEntityId || "",
      },
    });

    return created;
  },

  async createCheckoutSessionForUser(userId, payload, requestContext = {}) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw AppError.notFound("User not found.");
    }

    const customer = await createOrGetCustomer({
      email: user.email,
      name: user.displayName,
      metadata: {
        userId: user.id,
      },
    });

    const session = await createCheckoutSession({
      amount: payload.amount,
      currency: payload.currency,
      customerId: customer.id,
      successUrl: payload.successUrl,
      cancelUrl: payload.cancelUrl,
      metadata: toStripeMetadata({
        userId: user.id,
        sourceDomain: payload.sourceDomain || "",
        sourceEntityId: payload.sourceEntityId || "",
        sourceAction: payload.sourceAction || "",
        ...(payload.metadata || {}),
      }),
    });

    const created = await paymentsRepository.create({
      userId,
      amount: payload.amount,
      amountMajor: amountMajorFromMinor(payload.amount),
      currency: (
        payload.currency ||
        session.currency ||
        DEFAULT_CURRENCY
      ).toLowerCase(),
      description: payload.description || "",
      stripePaymentIntentId:
        session.payment_intent || `pi_pending_${session.id}`,
      stripeClientSecret: session.id,
      stripeCheckoutSessionId: session.id,
      state: PAYMENT_STATES.PROCESSING,
      stateReason: "checkout_session_created",
      sourceDomain: payload.sourceDomain || "",
      sourceEntityId: payload.sourceEntityId || "",
      sourceAction: payload.sourceAction || "",
      attemptCount: 1,
      retryCount: 0,
      timeoutAt: new Date(
        nowDate().getTime() + config.payments.attemptTimeoutMinutes * 60 * 1000,
      ),
      metadata: payload.metadata || {},
    });

    await appendLedgerEntry({
      payment: created,
      entryType: PAYMENT_LEDGER_ENTRY_TYPES.INTENT_CREATED,
      source: "api",
      idempotencyKey: `payment:${created.id}:checkout_created`,
      metadata: {
        checkoutSessionId: session.id,
        requestId: requestContext.requestId || null,
      },
    });

    return {
      payment: created,
      checkoutSession: {
        id: session.id,
        url: session.url,
      },
    };
  },

  async listPaymentsForUser(userId) {
    return paymentsRepository.listByUserId(userId);
  },

  async listPaymentLedgerForUser(userId) {
    return paymentsRepository.listLedgerByUserId(userId);
  },

  async getPaymentByIntentForUser(userId, paymentIntentId) {
    const payment = await paymentsRepository.findByIntentId(paymentIntentId);

    if (!payment) {
      throw AppError.notFound("Payment intent was not found.");
    }

    if (String(payment.userId) !== String(userId)) {
      throw AppError.forbidden("Payment intent does not belong to this user.");
    }

    return payment;
  },

  async confirmPaymentIntentForUser(userId, paymentIntentId) {
    const payment = await this.getPaymentByIntentForUser(
      userId,
      paymentIntentId,
    );

    if (
      [PAYMENT_STATES.PROCESSING, PAYMENT_STATES.RETRY_REQUIRED].includes(
        payment.state,
      ) &&
      payment.timeoutAt &&
      new Date(payment.timeoutAt).getTime() < nowDate().getTime()
    ) {
      await this.processTimedOutPayments(nowDate(), {
        requestId: null,
        actorId: userId,
        role: "user",
      });

      const refreshed =
        await paymentsRepository.findByIntentId(paymentIntentId);
      return refreshed || payment;
    }

    return payment;
  },

  async reconcilePaymentIntentWithStripe(paymentIntentId, requestContext = {}) {
    const payment = await paymentsRepository.findByIntentId(paymentIntentId);

    if (!payment) {
      throw AppError.notFound("Payment record was not found.");
    }

    const stripeIntent = await retrievePaymentIntent(paymentIntentId);

    const pseudoEvent = {
      id: `reconcile_${paymentIntentId}_${Date.now()}`,
      type: `payment_intent.${stripeIntent.status || "processing"}`,
      livemode: false,
      api_version: "manual",
      data: {
        object: {
          object: "payment_intent",
          ...stripeIntent,
        },
      },
    };

    return this.processStripeWebhookEvent({
      event: pseudoEvent,
      requestContext,
      skipWebhookReservation: true,
    });
  },

  async processStripeWebhookEvent({
    event,
    requestContext = {},
    skipWebhookReservation = false,
  }) {
    if (!event?.id || !event?.type) {
      throw new PaymentError(
        "Stripe event payload is missing required fields.",
      );
    }

    const normalizedPayload = normalizeStripeEvent(event);

    if (!normalizedPayload) {
      return {
        processed: false,
        ignored: true,
        reason: "unsupported_event",
      };
    }

    const payloadHash = createHash("sha256")
      .update(JSON.stringify(event))
      .digest("hex");

    let webhookRecord = null;

    if (!skipWebhookReservation) {
      const reservation = await reserveWebhookEvent({
        event,
        payloadHash,
        normalizedPayload,
      });

      webhookRecord = reservation.webhookRecord;

      if (reservation.duplicate) {
        reconciliationLogger.info(
          {
            requestId: requestContext.requestId,
            stripeEventId: event.id,
            stripeEventType: event.type,
          },
          "Duplicate Stripe webhook skipped",
        );

        return {
          processed: true,
          duplicate: true,
          paymentUpdated: false,
        };
      }
    }

    const processEvent = async () => {
      if (!normalizedPayload.paymentIntentId) {
        if (webhookRecord) {
          await paymentsRepository.markWebhookEventIgnored(webhookRecord.id, {
            reason: "event_has_no_payment_intent",
          });
        }

        return {
          processed: true,
          ignored: true,
          reason: "event_has_no_payment_intent",
        };
      }

      let payment = await paymentsRepository.findByIntentId(
        normalizedPayload.paymentIntentId,
      );

      if (
        !payment &&
        normalizedPayload.sourceKind === "checkout.session" &&
        normalizedPayload.stripeObjectId
      ) {
        payment = await paymentsRepository.findByCheckoutSessionId(
          normalizedPayload.stripeObjectId,
        );

        if (
          payment &&
          payment.stripePaymentIntentId !== normalizedPayload.paymentIntentId
        ) {
          payment = await paymentsRepository.updateById(payment.id, {
            stripePaymentIntentId: normalizedPayload.paymentIntentId,
          });
        }
      }

      if (!payment) {
        if (webhookRecord) {
          await paymentsRepository.markWebhookEventIgnored(webhookRecord.id, {
            reason: "payment_not_found",
            paymentIntentId: normalizedPayload.paymentIntentId,
          });
        }

        reconciliationLogger.warn(
          {
            requestId: requestContext.requestId,
            stripeEventId: event.id,
            stripeEventType: event.type,
            paymentIntentId: normalizedPayload.paymentIntentId,
          },
          "Stripe webhook ignored because payment record was not found",
        );

        return {
          processed: true,
          ignored: true,
          reason: "payment_not_found",
          paymentIntentId: normalizedPayload.paymentIntentId,
        };
      }

      const mismatchInfo = verifyWebhookAmountAndCurrency({
        payment,
        normalizedPayload,
      });

      let resolvedIncomingState = normalizedPayload.desiredState;
      let mismatchReason = "";

      if (mismatchInfo.isMismatch) {
        resolvedIncomingState = PAYMENT_STATES.RETRY_REQUIRED;
        mismatchReason = [
          mismatchInfo.amountMismatch ? "amount_mismatch" : "",
          mismatchInfo.currencyMismatch ? "currency_mismatch" : "",
        ]
          .filter(Boolean)
          .join(",");
      }

      const updatedPayment = await updatePaymentState({
        payment,
        incomingState: resolvedIncomingState,
        stateReason: normalizedPayload.statusReason,
        stripeEventId: event.id,
        stripeEventType: event.type,
        stripeEventAt: normalizedPayload.occurredAt,
        mismatchDetected: mismatchInfo.isMismatch,
        mismatchReason,
        metadata: {
          stripeObjectId: normalizedPayload.stripeObjectId,
          stripeSourceKind: normalizedPayload.sourceKind,
          stripeDeclaredAmountMinor: normalizedPayload.declaredAmountMinor,
          stripeReceivedAmountMinor: normalizedPayload.receivedAmountMinor,
        },
      });

      await appendLedgerEntry({
        payment: updatedPayment,
        entryType: mapPaymentStateToLedgerEntryType(updatedPayment.state),
        source: "webhook",
        stripeEventId: event.id,
        stripeEventType: event.type,
        occurredAt: normalizedPayload.occurredAt,
        metadata: {
          sourceKind: normalizedPayload.sourceKind,
          mismatchDetected: mismatchInfo.isMismatch,
          mismatchReason,
          declaredAmountMinor: normalizedPayload.declaredAmountMinor,
          receivedAmountMinor: normalizedPayload.receivedAmountMinor,
        },
      });

      await notifyPaymentStateTransition({
        previousPayment: payment,
        updatedPayment,
        requestContext,
      });

      const subscriptionSync = await reconcileSubscriptionForPayment({
        payment: updatedPayment,
        stripeEventId: event.id,
        stripeEventType: event.type,
        source: "stripe_webhook",
      });
      const charitySync = await reconcileCharityAccountingForPayment({
        payment: updatedPayment,
        stripeEventId: event.id,
        stripeEventType: event.type,
      });

      if (webhookRecord) {
        await paymentsRepository.markWebhookEventProcessed(webhookRecord.id, {
          paymentId: updatedPayment.id,
          paymentState: updatedPayment.state,
          subscriptionHandled: subscriptionSync.handled,
          charityHandled: charitySync.handled,
          mismatchDetected: mismatchInfo.isMismatch,
        });
      }

      reconciliationLogger.info(
        {
          requestId: requestContext.requestId,
          stripeEventId: event.id,
          stripeEventType: event.type,
          paymentId: updatedPayment.id,
          paymentIntentId: updatedPayment.stripePaymentIntentId,
          previousState: payment.state,
          nextState: updatedPayment.state,
          mismatchDetected: mismatchInfo.isMismatch,
          subscriptionHandled: subscriptionSync.handled,
          charityHandled: charitySync.handled,
        },
        "Stripe webhook payment reconciliation completed",
      );

      return {
        processed: true,
        duplicate: false,
        paymentUpdated: true,
        payment: updatedPayment,
        subscriptionSync,
        charitySync,
      };
    };

    try {
      return await withProcessingTimeout(
        processEvent(),
        config.stripe.webhookProcessingTimeoutMs,
      );
    } catch (error) {
      if (webhookRecord) {
        await paymentsRepository.markWebhookEventFailed(
          webhookRecord.id,
          error.message,
          {
            lastErrorAt: nowDate(),
          },
        );
      }

      reconciliationLogger.error(
        {
          requestId: requestContext.requestId,
          stripeEventId: event.id,
          stripeEventType: event.type,
          error: error.message,
        },
        "Stripe webhook processing failed",
      );

      throw error;
    }
  },

  async processTimedOutPayments(runAt = nowDate(), requestContext = {}) {
    const candidates = await paymentsRepository.findTimedOutCandidates(runAt);
    const timedOutPayments = [];

    for (const payment of candidates) {
      const updated = await updatePaymentState({
        payment,
        incomingState: PAYMENT_STATES.TIMEOUT,
        stateReason: "processing_timeout",
        stripeEventId: "",
        stripeEventType: "internal.timeout",
        stripeEventAt: runAt,
        metadata: {
          timeoutProcessedAt: runAt,
        },
      });

      await appendLedgerEntry({
        payment: updated,
        entryType: PAYMENT_LEDGER_ENTRY_TYPES.TIMEOUT,
        source: "timeout",
        runAt,
        metadata: {
          timeoutAt: payment.timeoutAt,
        },
      });

      await notifyPaymentStateTransition({
        previousPayment: payment,
        updatedPayment: updated,
        requestContext,
      });

      const subscriptionSync = await reconcileSubscriptionForPayment({
        payment: updated,
        stripeEventId: "",
        stripeEventType: "internal.timeout",
        source: "payment_timeout_processor",
      });
      const charitySync = await reconcileCharityAccountingForPayment({
        payment: updated,
        stripeEventId: "",
        stripeEventType: "internal.timeout",
      });

      timedOutPayments.push({
        payment: updated,
        subscriptionSync,
        charitySync,
      });
    }

    logAuditEvent({
      action: "payments.timeout.process",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "Payment",
      entityId: null,
      requestId: requestContext.requestId,
      metadata: {
        runAt,
        processedCount: timedOutPayments.length,
      },
    });

    return {
      processedAt: runAt,
      processedCount: timedOutPayments.length,
      payments: timedOutPayments.map((item) => item.payment),
    };
  },
};
