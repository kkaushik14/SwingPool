import { describe, expect, it, vi } from "vitest";

import { PAYMENT_STATES } from "../src/components/payments/payments.enums.js";
import { paymentsRepository } from "../src/components/payments/payments.repository.js";
import { paymentsService } from "../src/components/payments/payments.service.js";
import {
  SUBSCRIPTION_PLAN_CODES,
  SUBSCRIPTION_STATUSES,
} from "../src/components/subscriptions/subscriptions.enums.js";
import { subscriptionsRepository } from "../src/components/subscriptions/subscriptions.repository.js";
import { usersRepository } from "../src/components/users/users.repository.js";

const buildPayment = (overrides = {}) => ({
  id: "payment-id",
  userId: "507f1f77bcf86cd799439011",
  amount: 17900,
  amountMajor: "179.00",
  currency: "inr",
  state: PAYMENT_STATES.PROCESSING,
  stateReason: "intent_created",
  stripePaymentIntentId: "pi_123",
  stripeCheckoutSessionId: null,
  retryCount: 0,
  timeoutAt: new Date(Date.now() + 10 * 60 * 1000),
  finalizedAt: null,
  metadata: {},
  ...overrides,
});

const buildStripeEvent = ({
  id = "evt_123",
  type = "payment_intent.processing",
  intentId = "pi_123",
  status = "processing",
  amount = 17900,
  amountReceived = 0,
  currency = "inr",
  created = 1713763200,
}) => ({
  id,
  type,
  livemode: false,
  api_version: "2025-03-31.basil",
  data: {
    object: {
      object: "payment_intent",
      id: intentId,
      status,
      amount,
      amount_received: amountReceived,
      currency,
      created,
      metadata: {},
    },
  },
});

const mockCommonWebhookRepositoryCalls = () => {
  vi.spyOn(
    paymentsRepository,
    "findLedgerEntryByIdempotencyKey",
  ).mockResolvedValue(null);
  vi.spyOn(paymentsRepository, "createLedgerEntry").mockResolvedValue({
    id: "ledger-1",
  });
  vi.spyOn(paymentsRepository, "markWebhookEventProcessed").mockResolvedValue({
    id: "webhook-1",
  });
  vi.spyOn(paymentsRepository, "markWebhookEventIgnored").mockResolvedValue({
    id: "webhook-1",
  });
  vi.spyOn(paymentsRepository, "markWebhookEventFailed").mockResolvedValue({
    id: "webhook-1",
  });
  vi.spyOn(subscriptionsRepository, "findByPaymentIntentId").mockResolvedValue(
    null,
  );
  vi.spyOn(usersRepository, "updateById").mockResolvedValue({});
};

describe("Payments Webhook Service", () => {
  it("handles webhook replay and duplicate prevention idempotently", async () => {
    const event = buildStripeEvent({
      id: "evt_replay_1",
      intentId: "pi_missing",
    });

    vi.spyOn(paymentsRepository, "createWebhookEvent")
      .mockResolvedValueOnce({ id: "webhook-1", status: "processing" })
      .mockRejectedValueOnce({ code: 11000 });
    vi.spyOn(
      paymentsRepository,
      "findWebhookEventByStripeEventId",
    ).mockResolvedValue({
      id: "webhook-1",
      status: "ignored",
    });
    vi.spyOn(paymentsRepository, "findByIntentId").mockResolvedValue(null);
    mockCommonWebhookRepositoryCalls();

    const first = await paymentsService.processStripeWebhookEvent({ event });
    const second = await paymentsService.processStripeWebhookEvent({ event });

    expect(first.ignored).toBe(true);
    expect(second.duplicate).toBe(true);
  });

  it("processes delayed success after timeout and activates pending subscription", async () => {
    const event = buildStripeEvent({
      id: "evt_delayed_success",
      type: "payment_intent.succeeded",
      status: "succeeded",
      amountReceived: 17900,
    });

    let payment = buildPayment({ state: PAYMENT_STATES.TIMEOUT });

    vi.spyOn(paymentsRepository, "createWebhookEvent").mockResolvedValue({
      id: "webhook-2",
    });
    vi.spyOn(paymentsRepository, "findByIntentId").mockImplementation(
      async () => payment,
    );
    vi.spyOn(paymentsRepository, "updateById").mockImplementation(
      async (_id, updatePayload) => {
        payment = {
          ...payment,
          ...updatePayload,
        };
        return payment;
      },
    );
    mockCommonWebhookRepositoryCalls();

    const pendingSubscription = {
      id: "subscription-1",
      userId: payment.userId,
      planId: "plan-monthly",
      planCode: SUBSCRIPTION_PLAN_CODES.MONTHLY,
      status: SUBSCRIPTION_STATUSES.PENDING_PAYMENT,
      latestCouponCode: "",
      metadata: {},
    };

    vi.spyOn(
      subscriptionsRepository,
      "findByPaymentIntentId",
    ).mockResolvedValue(pendingSubscription);
    vi.spyOn(subscriptionsRepository, "findPlanById").mockResolvedValue({
      id: "plan-monthly",
      billingCycleDays: 30,
    });
    vi.spyOn(
      subscriptionsRepository,
      "updateSubscriptionById",
    ).mockResolvedValue({
      ...pendingSubscription,
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      startAt: new Date(),
      endAt: new Date(),
      nextBillingAt: new Date(),
    });
    vi.spyOn(subscriptionsRepository, "createHistory").mockResolvedValue({
      id: "history-1",
    });

    const result = await paymentsService.processStripeWebhookEvent({ event });

    expect(result.payment.state).toBe(PAYMENT_STATES.SUCCEEDED);
    expect(result.subscriptionSync.handled).toBe(true);
  });

  it("marks failed payment from webhook", async () => {
    const event = buildStripeEvent({
      id: "evt_failed",
      type: "payment_intent.payment_failed",
      status: "processing",
    });

    let payment = buildPayment();

    vi.spyOn(paymentsRepository, "createWebhookEvent").mockResolvedValue({
      id: "webhook-3",
    });
    vi.spyOn(paymentsRepository, "findByIntentId").mockImplementation(
      async () => payment,
    );
    vi.spyOn(paymentsRepository, "updateById").mockImplementation(
      async (_id, updatePayload) => {
        payment = {
          ...payment,
          ...updatePayload,
        };
        return payment;
      },
    );
    mockCommonWebhookRepositoryCalls();

    const result = await paymentsService.processStripeWebhookEvent({ event });

    expect(result.payment.state).toBe(PAYMENT_STATES.FAILED);
  });

  it("marks retry required when payment method/action is needed", async () => {
    const event = buildStripeEvent({
      id: "evt_retry_required",
      type: "payment_intent.payment_failed",
      status: "requires_payment_method",
    });

    let payment = buildPayment();

    vi.spyOn(paymentsRepository, "createWebhookEvent").mockResolvedValue({
      id: "webhook-4",
    });
    vi.spyOn(paymentsRepository, "findByIntentId").mockImplementation(
      async () => payment,
    );
    vi.spyOn(paymentsRepository, "updateById").mockImplementation(
      async (_id, updatePayload) => {
        payment = {
          ...payment,
          ...updatePayload,
        };
        return payment;
      },
    );
    mockCommonWebhookRepositoryCalls();

    const result = await paymentsService.processStripeWebhookEvent({ event });

    expect(result.payment.state).toBe(PAYMENT_STATES.RETRY_REQUIRED);
    expect(result.payment.retryCount).toBe(1);
  });

  it("marks cancelled payment from webhook", async () => {
    const event = buildStripeEvent({
      id: "evt_cancelled",
      type: "payment_intent.canceled",
      status: "canceled",
    });

    let payment = buildPayment();

    vi.spyOn(paymentsRepository, "createWebhookEvent").mockResolvedValue({
      id: "webhook-5",
    });
    vi.spyOn(paymentsRepository, "findByIntentId").mockImplementation(
      async () => payment,
    );
    vi.spyOn(paymentsRepository, "updateById").mockImplementation(
      async (_id, updatePayload) => {
        payment = {
          ...payment,
          ...updatePayload,
        };
        return payment;
      },
    );
    mockCommonWebhookRepositoryCalls();

    const result = await paymentsService.processStripeWebhookEvent({ event });

    expect(result.payment.state).toBe(PAYMENT_STATES.CANCELED);
  });

  it("marks timeout for stale processing payments", async () => {
    let payment = buildPayment({
      id: "payment-timeout-1",
      stripePaymentIntentId: "pi_timeout_1",
      state: PAYMENT_STATES.PROCESSING,
      timeoutAt: new Date("2026-04-20T00:00:00.000Z"),
    });

    vi.spyOn(paymentsRepository, "findTimedOutCandidates").mockResolvedValue([
      payment,
    ]);
    vi.spyOn(paymentsRepository, "updateById").mockImplementation(
      async (_id, updatePayload) => {
        payment = {
          ...payment,
          ...updatePayload,
        };
        return payment;
      },
    );
    vi.spyOn(
      paymentsRepository,
      "findLedgerEntryByIdempotencyKey",
    ).mockResolvedValue(null);
    vi.spyOn(paymentsRepository, "createLedgerEntry").mockResolvedValue({
      id: "ledger-timeout-1",
    });
    vi.spyOn(
      subscriptionsRepository,
      "findByPaymentIntentId",
    ).mockResolvedValue(null);

    const result = await paymentsService.processTimedOutPayments(
      new Date("2026-04-22T12:00:00.000Z"),
    );

    expect(result.processedCount).toBe(1);
    expect(result.payments[0].state).toBe(PAYMENT_STATES.TIMEOUT);
  });

  it("moves mismatched webhook events to retry_required", async () => {
    const event = buildStripeEvent({
      id: "evt_mismatch",
      type: "payment_intent.succeeded",
      status: "succeeded",
      amount: 49900,
      amountReceived: 49900,
    });

    let payment = buildPayment({ amount: 17900, amountMajor: "179.00" });

    vi.spyOn(paymentsRepository, "createWebhookEvent").mockResolvedValue({
      id: "webhook-6",
    });
    vi.spyOn(paymentsRepository, "findByIntentId").mockImplementation(
      async () => payment,
    );
    vi.spyOn(paymentsRepository, "updateById").mockImplementation(
      async (_id, updatePayload) => {
        payment = {
          ...payment,
          ...updatePayload,
        };
        return payment;
      },
    );
    mockCommonWebhookRepositoryCalls();

    const result = await paymentsService.processStripeWebhookEvent({ event });

    expect(result.payment.state).toBe(PAYMENT_STATES.RETRY_REQUIRED);
    expect(result.payment.mismatchDetected).toBe(true);
  });
});
