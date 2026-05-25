import { auditComponentService } from "../audit/index.js";
import {
  CHARITY_PAYOUT_ENTRY_TYPES,
  CHARITY_PAYOUT_STATUSES,
  DONATION_STATUSES,
  charitiesService,
  toCharityDto,
  toContributionRuleDto,
  toDonationDto,
  toPayoutLedgerDto,
} from "../charities/index.js";
import {
  drawsService,
  toDrawDto,
  toDrawEntryDto,
  toDrawSimulationDto,
  toJackpotLedgerDto,
  toPrizePoolDto,
  toPublishedResultDto,
} from "../draws/index.js";
import {
  PAYMENT_LEDGER_ENTRY_TYPES,
  PAYMENT_STATES,
  PAYMENT_TERMINAL_STATES,
  mapPaymentLedgerDirection,
  mapPaymentStateToLedgerEntryType,
  paymentsRepository,
  paymentsService,
} from "../payments/index.js";
import { toScoreDto, scoresService } from "../scores/index.js";
import {
  SUBSCRIPTION_HISTORY_EVENT_TYPES,
  SUBSCRIPTION_STATUSES,
  subscriptionsService,
  toCouponDto,
  toPlanDto,
  toSubscriptionConfigDto,
  toSubscriptionDto,
} from "../subscriptions/index.js";
import { toUserDto, usersService } from "../users/index.js";
import {
  toWinnerDto,
  toWinnerProofSubmissionDto,
  winnersService,
} from "../winners/index.js";
import { USER_ROLES } from "../../enums/index.js";
import { AppError } from "../../errors/index.js";
import { auditLogger, logger } from "../../logger/index.js";
import {
  buildPaginationMeta,
  resolvePagination,
  resolveSorting,
} from "../../utils/index.js";

import {
  ADMIN_ACTIONS,
  ADMIN_AUDIT_ENTITIES,
  ADMIN_MANUAL_DONATION_FIELDS,
  ADMIN_MANUAL_PAYMENT_FIELDS,
  ADMIN_MANUAL_SUBSCRIPTION_FIELDS,
  ADMIN_SENSITIVE_OPERATIONS,
} from "./admin.enums.js";
import { adminRepository } from "./admin.repository.js";
import { mapDomainSubscriptionStatusToUserSubscriptionStatus } from "../subscriptions/subscription-status.mapper.js";

const nowDate = () => new Date();

const toPlain = (value) => (value?.toObject ? value.toObject() : value);

const toPaymentDto = (payment) => {
  if (!payment) {
    return null;
  }

  const item = toPlain(payment);

  return {
    id: item.id || item._id?.toString(),
    userId: item.userId,
    amount: item.amount,
    amountMajor: item.amountMajor,
    currency: item.currency,
    description: item.description,
    stripePaymentIntentId: item.stripePaymentIntentId,
    stripeCheckoutSessionId: item.stripeCheckoutSessionId,
    state: item.state,
    stateReason: item.stateReason,
    sourceDomain: item.sourceDomain,
    sourceEntityId: item.sourceEntityId,
    sourceAction: item.sourceAction,
    attemptCount: item.attemptCount,
    retryCount: item.retryCount,
    timeoutAt: item.timeoutAt,
    finalizedAt: item.finalizedAt,
    stripeLastEventId: item.stripeLastEventId,
    stripeLastEventType: item.stripeLastEventType,
    stripeLastEventAt: item.stripeLastEventAt,
    mismatchDetected: item.mismatchDetected,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const toPaymentLedgerDto = (entry) => {
  if (!entry) {
    return null;
  }

  const item = toPlain(entry);

  return {
    id: item.id || item._id?.toString(),
    paymentId: item.paymentId,
    userId: item.userId,
    stripePaymentIntentId: item.stripePaymentIntentId,
    stripeEventId: item.stripeEventId,
    idempotencyKey: item.idempotencyKey,
    entryType: item.entryType,
    direction: item.direction,
    amountMinor: item.amountMinor,
    amountMajor: item.amountMajor,
    currency: item.currency,
    occurredAt: item.occurredAt,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
  };
};

const toAuditEventDto = (event) => {
  if (!event) {
    return null;
  }

  const item = toPlain(event);

  return {
    id: item.id || item._id?.toString(),
    action: item.action,
    actorId: item.actorId,
    actorRole: item.actorRole,
    entity: item.entity,
    entityId: item.entityId,
    requestId: item.requestId,
    metadata: item.metadata || {},
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const buildContext = (requestContext = {}) => {
  return {
    actorId: requestContext.actorId || null,
    role: requestContext.role || null,
    requestId: requestContext.requestId || null,
  };
};

const assertAdminContext = (requestContext = {}) => {
  if (requestContext.role !== USER_ROLES.ADMIN) {
    throw AppError.forbidden("Admin privileges are required for this action.");
  }
};

const ensureReason = (reason, actionName) => {
  if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
    throw AppError.validation(`A reason is required for ${actionName}.`);
  }

  return reason.trim();
};

const applyDateRangeFilter = (filter, field, from, to) => {
  if (!from && !to) {
    return;
  }

  filter[field] = {};

  if (from) {
    filter[field].$gte = from;
  }

  if (to) {
    filter[field].$lte = to;
  }
};

const toRegex = (value) => ({
  $regex: String(value || "").trim(),
  $options: "i",
});

const createPaginatedResult = ({ items, totalItems, pagination }) => {
  return {
    items,
    meta: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
    }),
  };
};

const recordAdminAuditEvent = async ({
  action,
  entity,
  entityId,
  requestContext,
  before = null,
  after = null,
  reason = null,
  metadata = {},
  sensitiveOperation = null,
}) => {
  const context = buildContext(requestContext);

  const payload = {
    action,
    actorId: context.actorId,
    actorRole: context.role,
    entity,
    entityId: entityId ? String(entityId) : null,
    requestId: context.requestId,
    metadata: {
      before,
      after,
      reason: reason || null,
      sensitiveOperation: sensitiveOperation || null,
      ...metadata,
    },
    at: nowDate().toISOString(),
  };

  auditLogger.info(payload);

  try {
    await auditComponentService.recordEvent(payload);
  } catch (error) {
    logger.warn(
      {
        action,
        entity,
        entityId,
        requestId: context.requestId,
        error: error.message,
      },
      "Failed to persist admin audit event",
    );
  }
};

const stripUndefined = (value = {}) => {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
};

const parseSort = (query, options) => {
  return resolveSorting(
    {
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    options,
  );
};

export const adminService = {
  async listUsers(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: [
        "createdAt",
        "updatedAt",
        "email",
        "displayName",
        "lastLoginAt",
      ],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.subscriptionStatus) {
      filter.subscriptionStatus = query.subscriptionStatus;
    }

    if (query.emailVerified !== undefined) {
      filter.emailVerifiedAt = query.emailVerified ? { $ne: null } : null;
    }

    if (query.search) {
      filter.$or = [
        { email: toRegex(query.search) },
        { displayName: toRegex(query.search) },
      ];
    }

    const [records, totalItems] = await Promise.all([
      adminRepository.listUsers({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countUsers(filter),
    ]);

    const profilesByUserId = new Map();
    const profiles = await Promise.all(
      records.map((item) => adminRepository.findUserProfileByUserId(item.id)),
    );

    profiles.forEach((profile) => {
      if (profile?.userId) {
        profilesByUserId.set(String(profile.userId), profile);
      }
    });

    let items = records.map((user) =>
      toUserDto(user, profilesByUserId.get(String(user.id || user._id))),
    );

    if (query.verificationStatus) {
      items = items.filter(
        (item) => item.profile?.verificationStatus === query.verificationStatus,
      );
    }

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.USERS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.USER,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({
      items,
      totalItems,
      pagination,
    });
  },

  async getUserById(userId, requestContext = {}) {
    assertAdminContext(requestContext);

    const [user, profile] = await Promise.all([
      adminRepository.findUserById(userId),
      adminRepository.findUserProfileByUserId(userId),
    ]);

    if (!user) {
      throw AppError.notFound("User not found.");
    }

    const data = toUserDto(user, profile);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.USER_GET,
      entity: ADMIN_AUDIT_ENTITIES.USER,
      entityId: userId,
      requestContext,
      metadata: {
        userStatus: data.status,
      },
    });

    return data;
  },

  async updateUser(userId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "admin user update");

    const [beforeUser, beforeProfile] = await Promise.all([
      adminRepository.findUserById(userId),
      adminRepository.findUserProfileByUserId(userId),
    ]);

    if (!beforeUser) {
      throw AppError.notFound("User not found.");
    }

    const updatePayload = stripUndefined({
      displayName: payload.displayName,
      status: payload.status,
      subscriptionStatus: payload.subscriptionStatus,
      mustRotatePassword: payload.mustRotatePassword,
    });

    const updated = await usersService.adminUpdateUser(userId, updatePayload, {
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      requestId: requestContext.requestId,
    });

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.USER_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.USER,
      entityId: userId,
      requestContext,
      before: toUserDto(beforeUser, beforeProfile),
      after: updated,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.USER_UPDATE,
      metadata: {
        updatedFields: Object.keys(updatePayload),
      },
    });

    return updated;
  },

  async verifyUserProfile(userId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "profile verification update");

    const [beforeUser, beforeProfile] = await Promise.all([
      adminRepository.findUserById(userId),
      adminRepository.findUserProfileByUserId(userId),
    ]);

    if (!beforeUser || !beforeProfile) {
      throw AppError.notFound("User profile not found.");
    }

    const updated = await usersService.adminVerifyUserProfile(
      userId,
      {
        verificationStatus: payload.verificationStatus,
        verificationReason: payload.verificationReason || "",
      },
      {
        actorId: requestContext.actorId,
        actorRole: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.USER_PROFILE_VERIFICATION,
      entity: ADMIN_AUDIT_ENTITIES.USER_PROFILE,
      entityId: beforeProfile.id,
      requestContext,
      before: toUserDto(beforeUser, beforeProfile),
      after: updated,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.USER_PROFILE_VERIFICATION,
      metadata: {
        verificationStatus: payload.verificationStatus,
        verificationReason: payload.verificationReason || "",
      },
    });

    return updated;
  },

  async listPlans(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const records = await subscriptionsService.adminListPlans({
      includeInactive: query.includeInactive !== false,
    });

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PLANS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.PLAN,
      requestContext,
      metadata: {
        includeInactive: query.includeInactive !== false,
        resultCount: records.length,
      },
    });

    return records;
  },

  async createPlan(payload, requestContext = {}) {
    assertAdminContext(requestContext);
    const reason = ensureReason(payload.reason, "plan creation");

    const created = await subscriptionsService.adminCreatePlan(
      stripUndefined({
        code: payload.code,
        name: payload.name,
        description: payload.description,
        priceInr: payload.priceInr,
        billingCycleDays: payload.billingCycleDays,
        hierarchyLevel: payload.hierarchyLevel,
        isDefault: payload.isDefault,
        isActive: payload.isActive,
        metadata: payload.metadata,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PLAN_CREATE,
      entity: ADMIN_AUDIT_ENTITIES.PLAN,
      entityId: created.id,
      requestContext,
      after: created,
      reason,
      metadata: {
        planCode: created.code,
      },
    });

    return created;
  },

  async updatePlan(planId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "plan update");
    const before = await adminRepository.findPlanById(planId);

    if (!before) {
      throw AppError.notFound("Subscription plan not found.");
    }

    const updatePayload = stripUndefined({
      code: payload.code,
      name: payload.name,
      description: payload.description,
      priceInr: payload.priceInr,
      billingCycleDays: payload.billingCycleDays,
      hierarchyLevel: payload.hierarchyLevel,
      isDefault: payload.isDefault,
      isActive: payload.isActive,
      metadata: payload.metadata,
    });

    const updated = await subscriptionsService.adminUpdatePlan(
      planId,
      updatePayload,
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PLAN_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.PLAN,
      entityId: planId,
      requestContext,
      before: toPlanDto(before),
      after: updated,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.PLAN_UPDATE,
      metadata: {
        updatedFields: Object.keys(updatePayload),
      },
    });

    return updated;
  },

  async listCoupons(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const records = await subscriptionsService.adminListCoupons({
      includeInactive: query.includeInactive !== false,
    });

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.COUPONS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.COUPON,
      requestContext,
      metadata: {
        includeInactive: query.includeInactive !== false,
        resultCount: records.length,
      },
    });

    return records;
  },

  async createCoupon(payload, requestContext = {}) {
    assertAdminContext(requestContext);
    const reason = ensureReason(payload.reason, "coupon creation");

    const created = await subscriptionsService.adminCreateCoupon(
      stripUndefined({
        code: payload.code,
        description: payload.description,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        maxDiscountInr: payload.maxDiscountInr,
        minOrderAmountInr: payload.minOrderAmountInr,
        maxRedemptions: payload.maxRedemptions,
        validFrom: payload.validFrom,
        validTo: payload.validTo,
        applicablePlanCodes: payload.applicablePlanCodes,
        isActive: payload.isActive,
        metadata: payload.metadata,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.COUPON_CREATE,
      entity: ADMIN_AUDIT_ENTITIES.COUPON,
      entityId: created.id,
      requestContext,
      after: created,
      reason,
      metadata: {
        couponCode: created.code,
      },
    });

    return created;
  },

  async updateCoupon(couponId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "coupon update");
    const before = await adminRepository.findCouponById(couponId);

    if (!before) {
      throw AppError.notFound("Coupon not found.");
    }

    const updatePayload = stripUndefined({
      description: payload.description,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      maxDiscountInr: payload.maxDiscountInr,
      minOrderAmountInr: payload.minOrderAmountInr,
      maxRedemptions: payload.maxRedemptions,
      validFrom: payload.validFrom,
      validTo: payload.validTo,
      applicablePlanCodes: payload.applicablePlanCodes,
      isActive: payload.isActive,
      metadata: payload.metadata,
    });

    const updated = await subscriptionsService.adminUpdateCoupon(
      couponId,
      updatePayload,
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.COUPON_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.COUPON,
      entityId: couponId,
      requestContext,
      before: toCouponDto(before),
      after: updated,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.COUPON_UPDATE,
      metadata: {
        updatedFields: Object.keys(updatePayload),
      },
    });

    return updated;
  },

  async getSubscriptionConfig(requestContext = {}) {
    assertAdminContext(requestContext);

    const config = await subscriptionsService.getConfig();

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SUBSCRIPTION_CONFIG_GET,
      entity: ADMIN_AUDIT_ENTITIES.SUBSCRIPTION,
      requestContext,
    });

    return config;
  },

  async updateSubscriptionConfig(payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "subscription config update");
    const before = await adminRepository.getSubscriptionConfig();

    const updated = await subscriptionsService.adminUpdateConfig(
      stripUndefined({
        gracePeriodDays: payload.gracePeriodDays,
        mandatoryCharityPercentage: payload.mandatoryCharityPercentage,
        metadata: payload.metadata,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SUBSCRIPTION_CONFIG_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.SUBSCRIPTION,
      requestContext,
      before: toSubscriptionConfigDto(before),
      after: updated,
      reason,
      metadata: {
        updatedFields: Object.keys(payload).filter((key) => key !== "reason"),
      },
    });

    return updated;
  },

  async listSubscriptions(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: [
        "createdAt",
        "updatedAt",
        "startAt",
        "endAt",
        "nextBillingAt",
        "planCode",
        "status",
      ],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.planCode) {
      filter.planCode = String(query.planCode).toLowerCase();
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.autoRenew !== undefined) {
      filter.autoRenew = query.autoRenew;
    }

    if (query.charityId) {
      filter.charityId = query.charityId;
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    const [records, totalItems] = await Promise.all([
      adminRepository.listSubscriptions({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countSubscriptions(filter),
    ]);

    const items = records.map(toSubscriptionDto);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SUBSCRIPTIONS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.SUBSCRIPTION,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({ items, totalItems, pagination });
  },

  async getSubscriptionById(subscriptionId, requestContext = {}) {
    assertAdminContext(requestContext);

    const record = await adminRepository.findSubscriptionById(subscriptionId);

    if (!record) {
      throw AppError.notFound("Subscription not found.");
    }

    const data = toSubscriptionDto(record);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SUBSCRIPTION_GET,
      entity: ADMIN_AUDIT_ENTITIES.SUBSCRIPTION,
      entityId: subscriptionId,
      requestContext,
      metadata: {
        status: data.status,
      },
    });

    return data;
  },

  async cancelSubscription(subscriptionId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "subscription cancellation");
    const before = await adminRepository.findSubscriptionById(subscriptionId);

    if (!before) {
      throw AppError.notFound("Subscription not found.");
    }

    const canceled = await subscriptionsService.cancelSubscriptionForUser(
      {
        subscriptionId,
        requesterUserId: before.userId,
        requesterRole: USER_ROLES.ADMIN,
        reason,
      },
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SUBSCRIPTION_CANCEL,
      entity: ADMIN_AUDIT_ENTITIES.SUBSCRIPTION,
      entityId: subscriptionId,
      requestContext,
      before: toSubscriptionDto(before),
      after: canceled.subscription,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.SUBSCRIPTION_CANCEL,
      metadata: {
        cancellationEvent: canceled.cancellationEvent,
      },
    });

    return canceled;
  },

  async markSubscriptionRenewalFailed(
    subscriptionId,
    payload,
    requestContext = {},
  ) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "renewal failure update");
    const before = await adminRepository.findSubscriptionById(subscriptionId);

    if (!before) {
      throw AppError.notFound("Subscription not found.");
    }

    const updated = await subscriptionsService.markRenewalFailed(
      subscriptionId,
      reason,
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SUBSCRIPTION_RENEWAL_FAILED,
      entity: ADMIN_AUDIT_ENTITIES.SUBSCRIPTION,
      entityId: subscriptionId,
      requestContext,
      before: toSubscriptionDto(before),
      after: toSubscriptionDto(updated),
      reason,
      sensitiveOperation:
        ADMIN_SENSITIVE_OPERATIONS.SUBSCRIPTION_MANUAL_ADJUSTMENT,
    });

    return toSubscriptionDto(updated);
  },

  async processGracePeriodExpirations(payload = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const result = await subscriptionsService.processGracePeriodExpirations(
      payload.runAt || nowDate(),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SUBSCRIPTION_GRACE_PROCESS,
      entity: ADMIN_AUDIT_ENTITIES.SUBSCRIPTION,
      requestContext,
      reason: payload.reason || null,
      metadata: {
        runAt: payload.runAt || null,
        expiredCount: result.expiredCount,
        expiredSubscriptionIds: (result.expiredSubscriptions || []).map(
          (item) => item.id,
        ),
      },
    });

    return result;
  },

  async manualAdjustSubscription(subscriptionId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(
      payload.reason,
      "manual subscription adjustment",
    );
    const before = await adminRepository.findSubscriptionById(subscriptionId);

    if (!before) {
      throw AppError.notFound("Subscription not found.");
    }

    const updatePayload = stripUndefined({
      status: payload.status,
      autoRenew: payload.autoRenew,
      startAt: payload.startAt,
      endAt: payload.endAt,
      nextBillingAt: payload.nextBillingAt,
      gracePeriodEndsAt: payload.gracePeriodEndsAt,
      canceledAt: payload.canceledAt,
      metadata: payload.metadata,
      lastPaymentStatus: payload.lastPaymentStatus,
    });

    const fields = Object.keys(updatePayload);

    if (fields.length === 0) {
      throw AppError.validation(
        "At least one subscription field must be provided.",
      );
    }

    for (const field of fields) {
      if (!ADMIN_MANUAL_SUBSCRIPTION_FIELDS.includes(field)) {
        throw AppError.validation(
          `Field '${field}' cannot be manually adjusted.`,
        );
      }
    }

    const updated = await adminRepository.updateSubscriptionById(
      subscriptionId,
      updatePayload,
    );

    if (!updated) {
      throw AppError.notFound("Subscription not found.");
    }

    if (updatePayload.status && updatePayload.status !== before.status) {
      await adminRepository.createSubscriptionHistory({
        subscriptionId: updated.id,
        userId: updated.userId,
        eventType: SUBSCRIPTION_HISTORY_EVENT_TYPES.ADMIN_MANUAL_ADJUSTMENT,
        previousStatus: before.status,
        nextStatus: updatePayload.status,
        previousPlanCode: before.planCode,
        nextPlanCode: updated.planCode,
        actorId: requestContext.actorId || null,
        metadata: {
          reason,
          adjustedFields: fields,
        },
        occurredAt: nowDate(),
      });

      await usersService
        .adminUpdateUser(
          before.userId,
          {
            subscriptionStatus:
              mapDomainSubscriptionStatusToUserSubscriptionStatus(
                updatePayload.status,
              ),
          },
          {
            actorId: requestContext.actorId,
            actorRole: requestContext.role,
            requestId: requestContext.requestId,
          },
        )
        .catch(() => null);
    }

    const after = toSubscriptionDto(updated);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SUBSCRIPTION_MANUAL_ADJUSTMENT,
      entity: ADMIN_AUDIT_ENTITIES.SUBSCRIPTION,
      entityId: subscriptionId,
      requestContext,
      before: toSubscriptionDto(before),
      after,
      reason,
      sensitiveOperation:
        ADMIN_SENSITIVE_OPERATIONS.SUBSCRIPTION_MANUAL_ADJUSTMENT,
      metadata: {
        adjustedFields: fields,
      },
    });

    return after;
  },

  async listPayments(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: [
        "createdAt",
        "updatedAt",
        "state",
        "amount",
        "finalizedAt",
        "timeoutAt",
      ],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.state) {
      filter.state = query.state;
    }

    if (query.sourceDomain) {
      filter.sourceDomain = query.sourceDomain;
    }

    if (query.mismatchDetected !== undefined) {
      filter.mismatchDetected = query.mismatchDetected;
    }

    if (query.stripePaymentIntentId) {
      filter.stripePaymentIntentId = query.stripePaymentIntentId;
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    const [records, totalItems] = await Promise.all([
      adminRepository.listPayments({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countPayments(filter),
    ]);

    const items = records.map(toPaymentDto);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PAYMENTS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.PAYMENT,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({ items, totalItems, pagination });
  },

  async getPaymentById(paymentId, requestContext = {}) {
    assertAdminContext(requestContext);

    const record = await adminRepository.findPaymentById(paymentId);

    if (!record) {
      throw AppError.notFound("Payment not found.");
    }

    const data = toPaymentDto(record);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PAYMENT_GET,
      entity: ADMIN_AUDIT_ENTITIES.PAYMENT,
      entityId: paymentId,
      requestContext,
      metadata: {
        state: data.state,
      },
    });

    return data;
  },

  async listPaymentLedger(paymentId, requestContext = {}) {
    assertAdminContext(requestContext);

    const payment = await adminRepository.findPaymentById(paymentId);

    if (!payment) {
      throw AppError.notFound("Payment not found.");
    }

    const records =
      await adminRepository.listPaymentLedgerByPaymentId(paymentId);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PAYMENT_LEDGER_LIST,
      entity: ADMIN_AUDIT_ENTITIES.PAYMENT,
      entityId: paymentId,
      requestContext,
      metadata: {
        ledgerCount: records.length,
      },
    });

    return records.map(toPaymentLedgerDto);
  },

  async processPaymentTimeouts(payload = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const result = await paymentsService.processTimedOutPayments(
      payload.runAt || nowDate(),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PAYMENT_TIMEOUT_PROCESS,
      entity: ADMIN_AUDIT_ENTITIES.PAYMENT,
      requestContext,
      reason: payload.reason || null,
      metadata: {
        runAt: payload.runAt || null,
        timedOutCount: result.timedOutCount,
      },
    });

    return result;
  },

  async manualAdjustPayment(paymentId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "manual payment adjustment");
    const before = await adminRepository.findPaymentById(paymentId);

    if (!before) {
      throw AppError.notFound("Payment not found.");
    }

    const updatePayload = stripUndefined({
      state: payload.state,
      stateReason: payload.stateReason,
      timeoutAt: payload.timeoutAt,
      finalizedAt: payload.finalizedAt,
      mismatchDetected: payload.mismatchDetected,
      metadata: payload.metadata,
    });

    const fields = Object.keys(updatePayload);

    if (fields.length === 0) {
      throw AppError.validation("At least one payment field must be provided.");
    }

    for (const field of fields) {
      if (!ADMIN_MANUAL_PAYMENT_FIELDS.includes(field)) {
        throw AppError.validation(
          `Field '${field}' cannot be manually adjusted.`,
        );
      }
    }

    if (
      updatePayload.state &&
      PAYMENT_TERMINAL_STATES.includes(updatePayload.state)
    ) {
      updatePayload.finalizedAt = updatePayload.finalizedAt || nowDate();
    }

    const updated = await adminRepository.updatePaymentById(
      paymentId,
      updatePayload,
    );

    if (!updated) {
      throw AppError.notFound("Payment not found.");
    }

    if (updatePayload.state && updatePayload.state !== before.state) {
      const entryType = mapPaymentStateToLedgerEntryType(updatePayload.state);

      await paymentsRepository.createLedgerEntry({
        paymentId: updated.id,
        userId: updated.userId,
        stripePaymentIntentId: updated.stripePaymentIntentId,
        stripeEventId: "",
        idempotencyKey: `admin-manual:${updated.id}:${Date.now()}`,
        entryType,
        direction: mapPaymentLedgerDirection(entryType),
        amountMinor: Number(updated.amount || 0),
        amountMajor: updated.amountMajor,
        currency: updated.currency,
        occurredAt: nowDate(),
        metadata: {
          reason,
          previousState: before.state,
          nextState: updatePayload.state,
          source: "admin_manual_adjustment",
        },
      });
    }

    const after = toPaymentDto(updated);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PAYMENT_MANUAL_ADJUSTMENT,
      entity: ADMIN_AUDIT_ENTITIES.PAYMENT,
      entityId: paymentId,
      requestContext,
      before: toPaymentDto(before),
      after,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.PAYMENT_MANUAL_ADJUSTMENT,
      metadata: {
        adjustedFields: fields,
      },
    });

    return after;
  },

  async listCharities(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: ["createdAt", "updatedAt", "name", "code", "status"],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { name: toRegex(query.search) },
        { code: toRegex(query.search) },
      ];
    }

    const [records, totalItems] = await Promise.all([
      adminRepository.listCharities({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countCharities(filter),
    ]);

    const items = records.map(toCharityDto);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.CHARITIES_LIST,
      entity: ADMIN_AUDIT_ENTITIES.CHARITY,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({ items, totalItems, pagination });
  },

  async createCharity(payload, requestContext = {}) {
    assertAdminContext(requestContext);
    const reason = ensureReason(payload.reason, "charity creation");

    const created = await charitiesService.create(
      stripUndefined({
        code: payload.code,
        name: payload.name,
        mission: payload.mission,
        website: payload.website,
        currency: payload.currency,
        supportedCurrencies: payload.supportedCurrencies,
        isFeatured: payload.isFeatured,
        status: payload.status,
        metadata: payload.metadata,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.CHARITY_CREATE,
      entity: ADMIN_AUDIT_ENTITIES.CHARITY,
      entityId: created.id,
      requestContext,
      after: created,
      reason,
    });

    return created;
  },

  async updateCharity(charityId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "charity update");
    const before = await adminRepository.findCharityById(charityId);

    if (!before) {
      throw AppError.notFound("Charity not found.");
    }

    const updated = await charitiesService.update(
      charityId,
      stripUndefined({
        code: payload.code,
        name: payload.name,
        mission: payload.mission,
        website: payload.website,
        currency: payload.currency,
        supportedCurrencies: payload.supportedCurrencies,
        isFeatured: payload.isFeatured,
        status: payload.status,
        metadata: payload.metadata,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.CHARITY_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.CHARITY,
      entityId: charityId,
      requestContext,
      before: toCharityDto(before),
      after: updated,
      reason,
      metadata: {
        updatedFields: Object.keys(payload).filter((key) => key !== "reason"),
      },
    });

    return updated;
  },

  async getContributionRule(requestContext = {}) {
    assertAdminContext(requestContext);

    const rule = await charitiesService.getContributionRule();

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.CHARITY_RULE_GET,
      entity: ADMIN_AUDIT_ENTITIES.CHARITY,
      requestContext,
    });

    return rule;
  },

  async updateContributionRule(payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "contribution rule update");
    const before = await charitiesService.getContributionRule();

    const updated = await charitiesService.adminUpdateContributionRule(
      stripUndefined({
        gatewayFeePercentage: payload.gatewayFeePercentage,
        prizePoolPercentage: payload.prizePoolPercentage,
        mandatoryCharityPercentage: payload.mandatoryCharityPercentage,
        metadata: payload.metadata,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.CHARITY_RULE_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.CHARITY,
      requestContext,
      before,
      after: updated,
      reason,
      metadata: {
        updatedFields: Object.keys(payload).filter((key) => key !== "reason"),
      },
    });

    return updated;
  },

  async listDonations(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: [
        "createdAt",
        "updatedAt",
        "finalizedAt",
        "amountMinor",
        "status",
      ],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.charityId) {
      filter.charityId = query.charityId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.source) {
      filter.source = query.source;
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    const [records, totalItems] = await Promise.all([
      adminRepository.listDonations({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countDonations(filter),
    ]);

    const items = records.map(toDonationDto);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DONATIONS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.DONATION,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({ items, totalItems, pagination });
  },

  async manualAdjustDonation(donationId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "manual donation adjustment");
    const before = await adminRepository.findDonationById(donationId);

    if (!before) {
      throw AppError.notFound("Donation not found.");
    }

    const updatePayload = stripUndefined({
      status: payload.status,
      finalizedAt: payload.finalizedAt,
      userMessage: payload.userMessage,
      metadata: payload.metadata,
    });

    const fields = Object.keys(updatePayload);

    if (fields.length === 0) {
      throw AppError.validation(
        "At least one donation field must be provided.",
      );
    }

    for (const field of fields) {
      if (!ADMIN_MANUAL_DONATION_FIELDS.includes(field)) {
        throw AppError.validation(
          `Field '${field}' cannot be manually adjusted.`,
        );
      }
    }

    if (
      updatePayload.status &&
      [
        DONATION_STATUSES.SUCCEEDED,
        DONATION_STATUSES.FAILED,
        DONATION_STATUSES.CANCELLED,
        DONATION_STATUSES.TIMEOUT,
      ].includes(updatePayload.status)
    ) {
      updatePayload.finalizedAt = updatePayload.finalizedAt || nowDate();
    }

    const updated = await adminRepository.updateDonationById(
      donationId,
      updatePayload,
    );

    if (!updated) {
      throw AppError.notFound("Donation not found.");
    }

    const after = toDonationDto(updated);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DONATION_MANUAL_ADJUSTMENT,
      entity: ADMIN_AUDIT_ENTITIES.DONATION,
      entityId: donationId,
      requestContext,
      before: toDonationDto(before),
      after,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.DONATION_MANUAL_ADJUSTMENT,
      metadata: {
        adjustedFields: fields,
      },
    });

    return after;
  },

  async listPayouts(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: [
        "createdAt",
        "updatedAt",
        "processedAt",
        "amountMinor",
        "status",
      ],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.charityId) {
      filter.charityId = query.charityId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.entryType) {
      filter.entryType = query.entryType;
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    const [records, totalItems] = await Promise.all([
      adminRepository.listPayouts({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countPayouts(filter),
    ]);

    const items = records.map(toPayoutLedgerDto);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PAYOUTS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.PAYOUT,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({ items, totalItems, pagination });
  },

  async createPayout(payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "payout creation");

    const created = await charitiesService.createPayoutEntry(
      stripUndefined({
        charityId: payload.charityId,
        entryType: payload.entryType,
        amountInr: payload.amountInr,
        status: payload.status,
        externalReference: payload.externalReference,
        notes: payload.notes,
        metadata: payload.metadata,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PAYOUT_CREATE,
      entity: ADMIN_AUDIT_ENTITIES.PAYOUT,
      entityId: created.id,
      requestContext,
      after: created,
      reason,
    });

    return created;
  },

  async updatePayout(payoutId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "payout update");
    const before = await adminRepository.findPayoutById(payoutId);

    if (!before) {
      throw AppError.notFound("Payout record not found.");
    }

    const updated = await charitiesService.updatePayoutEntry(
      payoutId,
      stripUndefined({
        status: payload.status,
        externalReference: payload.externalReference,
        notes: payload.notes,
        metadata: payload.metadata,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.PAYOUT_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.PAYOUT,
      entityId: payoutId,
      requestContext,
      before: toPayoutLedgerDto(before),
      after: updated,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.PAYOUT_UPDATE,
      metadata: {
        updatedFields: Object.keys(payload).filter((key) => key !== "reason"),
      },
    });

    return updated;
  },

  async createCharityManualAdjustment(payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "charity manual adjustment");

    const entryType =
      payload.adjustmentType === "credit"
        ? CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_CREDIT
        : CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_DEBIT;

    const created = await charitiesService.createManualAdjustment(
      {
        charityId: payload.charityId,
        amountInr: payload.amountInr,
        entryType,
        status: CHARITY_PAYOUT_STATUSES.COMPLETED,
        notes: payload.notes || reason,
        metadata: {
          ...(payload.metadata || {}),
          adjustmentReason: reason,
          paymentId: payload.paymentId || null,
          donationId: payload.donationId || null,
        },
      },
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.CHARITY_MANUAL_ADJUSTMENT,
      entity: ADMIN_AUDIT_ENTITIES.PAYOUT,
      entityId: created.id,
      requestContext,
      after: created,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.PAYOUT_UPDATE,
      metadata: {
        adjustmentType: payload.adjustmentType,
      },
    });

    return created;
  },

  async listScores(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: [
        "submittedAt",
        "createdAt",
        "playedDate",
        "contestNumber",
        "value",
      ],
      defaultSortBy: "submittedAt",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.includeBackdated === false) {
      filter.isBackdated = false;
    }

    if (query.contestNumber !== undefined) {
      filter.contestNumber = query.contestNumber;
    }

    applyDateRangeFilter(filter, "submittedAt", query.from, query.to);

    const [records, totalItems] = await Promise.all([
      adminRepository.listScores({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countScores(filter),
    ]);

    const items = records.map(toScoreDto);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SCORES_LIST,
      entity: ADMIN_AUDIT_ENTITIES.SCORE,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({ items, totalItems, pagination });
  },

  async updateScore(scoreId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const before = await adminRepository.findScoreById(scoreId);

    if (!before) {
      throw AppError.notFound("Score not found.");
    }

    const updated = await scoresService.adminUpdateScore(
      scoreId,
      {
        playedDate: payload.playedDate,
        value: payload.value,
        contestNumber: payload.contestNumber,
        status: payload.status,
        metadata: payload.metadata,
        editReason: payload.editReason,
      },
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.SCORE_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.SCORE,
      entityId: scoreId,
      requestContext,
      before: toScoreDto(before),
      after: updated,
      reason: payload.editReason,
      metadata: {
        updatedFields: Object.keys(payload).filter(
          (key) => key !== "editReason",
        ),
      },
    });

    return updated;
  },

  async listDraws(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: [
        "createdAt",
        "updatedAt",
        "year",
        "month",
        "drawAt",
        "status",
      ],
      defaultSortBy: "year",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.year !== undefined) {
      filter.year = query.year;
    }

    if (query.month !== undefined) {
      filter.month = query.month;
    }

    applyDateRangeFilter(filter, "drawAt", query.from, query.to);

    const [records, totalItems] = await Promise.all([
      adminRepository.listDraws({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countDraws(filter),
    ]);

    const items = records.map(toDrawDto);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAWS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({ items, totalItems, pagination });
  },

  async getDrawById(drawId, requestContext = {}) {
    assertAdminContext(requestContext);

    const draw = await adminRepository.findDrawById(drawId);

    if (!draw) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    const [entries, simulations, prizePool] = await Promise.all([
      adminRepository.listDrawEntriesByDrawId(drawId),
      adminRepository.listDrawSimulationsByDrawId(drawId),
      adminRepository.findDrawPrizePoolByDrawId(drawId),
    ]);

    const data = {
      draw: toDrawDto(draw),
      entries: entries.map(toDrawEntryDto),
      simulations: simulations.map(toDrawSimulationDto),
      prizePool: toPrizePoolDto(prizePool),
    };

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_GET,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: drawId,
      requestContext,
      metadata: {
        entriesCount: data.entries.length,
        simulationsCount: data.simulations.length,
      },
    });

    return data;
  },

  async createDraw(payload, requestContext = {}) {
    assertAdminContext(requestContext);
    const reason = ensureReason(payload.reason, "draw creation");

    const created = await drawsService.createSnapshot(
      stripUndefined({
        year: payload.year,
        month: payload.month,
        drawAt: payload.drawAt,
        prizePoolSnapshotStrategy: payload.prizePoolSnapshotStrategy,
        mode: payload.mode,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_CREATE,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: created.id,
      requestContext,
      after: created,
      reason,
    });

    return created;
  },

  async updateDraw(drawId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "draw update");
    const before = await adminRepository.findDrawById(drawId);

    if (!before) {
      throw AppError.notFound("Draw snapshot not found.");
    }

    const updated = await drawsService.updateSnapshot(
      drawId,
      stripUndefined({
        drawAt: payload.drawAt,
        eligibilityCutoffAt: payload.eligibilityCutoffAt,
        prizePoolSnapshotAt: payload.prizePoolSnapshotAt,
        status: payload.status,
        metadata: payload.metadata,
      }),
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: drawId,
      requestContext,
      before: toDrawDto(before),
      after: updated,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.DRAW_MANUAL_ADJUSTMENT,
      metadata: {
        updatedFields: Object.keys(payload).filter((key) => key !== "reason"),
      },
    });

    return updated;
  },

  async generateDrawEntries(drawId, requestContext = {}) {
    assertAdminContext(requestContext);

    const result = await drawsService.generateEntries(drawId, {
      actorId: requestContext.actorId,
      role: requestContext.role,
      requestId: requestContext.requestId,
    });

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_ENTRIES_GENERATE,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: drawId,
      requestContext,
      metadata: {
        totalEntries: result.totalEntries,
        totalEligibleUsers: result.totalEligibleUsers,
      },
    });

    return result;
  },

  async createDrawSimulation(drawId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const result = await drawsService.runSimulation(drawId, payload, {
      actorId: requestContext.actorId,
      role: requestContext.role,
      requestId: requestContext.requestId,
    });

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_SIMULATION_CREATE,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: drawId,
      requestContext,
      metadata: {
        simulationId: result.id,
      },
    });

    return result;
  },

  async listDrawSimulations(drawId, requestContext = {}) {
    assertAdminContext(requestContext);

    const records = await drawsService.listSimulations(drawId);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_SIMULATIONS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: drawId,
      requestContext,
      metadata: {
        resultCount: records.length,
      },
    });

    return records;
  },

  async publishDraw(drawId, requestContext = {}) {
    assertAdminContext(requestContext);

    const result = await drawsService.publishDraw(drawId, {
      actorId: requestContext.actorId,
      role: requestContext.role,
      requestId: requestContext.requestId,
    });

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_PUBLISH,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: drawId,
      requestContext,
      metadata: {
        publishedResultId: result.result?.id,
        prizePoolId: result.prizePool?.id,
      },
    });

    return result;
  },

  async getDrawResult(drawId, requestContext = {}) {
    assertAdminContext(requestContext);

    const result = await drawsService.getPublishedResult(drawId);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_RESULT_GET,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: drawId,
      requestContext,
      metadata: {
        publishedResultId: result.id,
      },
    });

    return toPublishedResultDto(result);
  },

  async getDrawPrizePool(drawId, requestContext = {}) {
    assertAdminContext(requestContext);

    const prizePool = await drawsService.getPrizePool(drawId);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_PRIZE_POOL_GET,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: drawId,
      requestContext,
      metadata: {
        prizePoolId: prizePool.id,
      },
    });

    return toPrizePoolDto(prizePool);
  },

  async addJackpotFund(payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "jackpot top-up");

    const created = await drawsService.addManualJackpotFund(
      {
        amountInr: payload.amountInr,
        notes: payload.notes || reason,
        metadata: payload.metadata,
      },
      {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    );

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_JACKPOT_TOPUP,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      entityId: created.id,
      requestContext,
      after: created,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.JACKPOT_TOPUP,
    });

    return toJackpotLedgerDto(created);
  },

  async listJackpotLedger(requestContext = {}) {
    assertAdminContext(requestContext);

    const records = await drawsService.listJackpotLedger();

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.DRAW_JACKPOT_LEDGER_LIST,
      entity: ADMIN_AUDIT_ENTITIES.DRAW,
      requestContext,
      metadata: {
        resultCount: records.length,
      },
    });

    return records.map(toJackpotLedgerDto);
  },

  async listWinners(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: [
        "createdAt",
        "updatedAt",
        "matchCount",
        "prizeAmountMinor",
        "payoutStatus",
      ],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.drawId) {
      filter.drawId = query.drawId;
    }

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.payoutStatus) {
      filter.payoutStatus = query.payoutStatus;
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    const [records, totalItems] = await Promise.all([
      adminRepository.listWinners({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countWinners(filter),
    ]);

    const items = records.map(toWinnerDto);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.WINNERS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.WINNER,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({ items, totalItems, pagination });
  },

  async getWinnerById(winnerId, requestContext = {}) {
    assertAdminContext(requestContext);

    const winner = await winnersService.getById(winnerId);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.WINNER_GET,
      entity: ADMIN_AUDIT_ENTITIES.WINNER,
      entityId: winnerId,
      requestContext,
      metadata: {
        payoutStatus: winner.payoutStatus,
      },
    });

    return winner;
  },

  async listWinnerProofs(winnerId, requestContext = {}) {
    assertAdminContext(requestContext);

    const winner = await adminRepository.findWinnerById(winnerId);

    if (!winner) {
      throw AppError.notFound("Winner not found.");
    }

    const proofs = await winnersService.listProofSubmissions({
      winnerId,
      requesterUserId: requestContext.actorId,
      requesterRole: USER_ROLES.ADMIN,
    });

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.WINNER_PROOFS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.WINNER_PROOF,
      entityId: winnerId,
      requestContext,
      metadata: {
        resultCount: proofs.length,
      },
    });

    return proofs.map(toWinnerProofSubmissionDto);
  },

  async reviewWinnerProof(winnerId, proofId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "winner proof review");

    const [beforeWinner, beforeProof] = await Promise.all([
      adminRepository.findWinnerById(winnerId),
      adminRepository.findWinnerProofById(proofId),
    ]);

    if (!beforeWinner || !beforeProof) {
      throw AppError.notFound("Winner proof not found.");
    }

    const updatedProof = await winnersService.reviewProofSubmission({
      winnerId,
      proofId,
      payload: {
        status: payload.status,
        rejectionReason: payload.rejectionReason,
        metadata: payload.metadata,
      },
      requestContext: {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    });

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.WINNER_PROOF_REVIEW,
      entity: ADMIN_AUDIT_ENTITIES.WINNER_PROOF,
      entityId: proofId,
      requestContext,
      before: toWinnerProofSubmissionDto(beforeProof),
      after: updatedProof,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.WINNER_PROOF_REVIEW,
      metadata: {
        winnerId,
        status: payload.status,
      },
    });

    return updatedProof;
  },

  async updateWinnerPayout(winnerId, payload, requestContext = {}) {
    assertAdminContext(requestContext);

    const reason = ensureReason(payload.reason, "winner payout update");
    const before = await adminRepository.findWinnerById(winnerId);

    if (!before) {
      throw AppError.notFound("Winner not found.");
    }

    const updated = await winnersService.updatePayoutStatus({
      winnerId,
      payload: {
        payoutStatus: payload.payoutStatus,
        rejectionReason: payload.rejectionReason,
        payoutReference: payload.payoutReference,
        metadata: payload.metadata,
      },
      requestContext: {
        actorId: requestContext.actorId,
        role: requestContext.role,
        requestId: requestContext.requestId,
      },
    });

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.WINNER_PAYOUT_UPDATE,
      entity: ADMIN_AUDIT_ENTITIES.WINNER,
      entityId: winnerId,
      requestContext,
      before: toWinnerDto(before),
      after: updated,
      reason,
      sensitiveOperation: ADMIN_SENSITIVE_OPERATIONS.WINNER_PAYOUT_UPDATE,
      metadata: {
        payoutStatus: payload.payoutStatus,
      },
    });

    return updated;
  },

  async listAuditEvents(query = {}, requestContext = {}) {
    assertAdminContext(requestContext);

    const pagination = resolvePagination(query);
    const sorting = parseSort(query, {
      allowedFields: [
        "createdAt",
        "updatedAt",
        "action",
        "entity",
        "actorRole",
      ],
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
    });

    const filter = {};

    if (query.actorId) {
      filter.actorId = query.actorId;
    }

    if (query.action) {
      filter.action = toRegex(query.action);
    }

    if (query.entity) {
      filter.entity = toRegex(query.entity);
    }

    if (query.requestId) {
      filter.requestId = query.requestId;
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    const [records, totalItems] = await Promise.all([
      adminRepository.listAuditEvents({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      adminRepository.countAuditEvents(filter),
    ]);

    const items = records.map(toAuditEventDto);

    await recordAdminAuditEvent({
      action: ADMIN_ACTIONS.AUDIT_EVENTS_LIST,
      entity: ADMIN_AUDIT_ENTITIES.AUDIT_EVENT,
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPaginatedResult({ items, totalItems, pagination });
  },
};
