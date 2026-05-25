import { describe, expect, it, vi } from "vitest";

import { DomainError } from "../src/errors/index.js";
import { usersRepository } from "../src/components/users/users.repository.js";
import {
  SUBSCRIPTION_HISTORY_EVENT_TYPES,
  SUBSCRIPTION_PLAN_CODES,
  SUBSCRIPTION_STATUSES,
} from "../src/components/subscriptions/subscriptions.enums.js";
import { subscriptionsRepository } from "../src/components/subscriptions/subscriptions.repository.js";
import { subscriptionsService } from "../src/components/subscriptions/subscriptions.service.js";

const buildPlan = (overrides = {}) => ({
  id: "plan-monthly-id",
  code: SUBSCRIPTION_PLAN_CODES.MONTHLY,
  name: "Monthly",
  priceInr: 179,
  billingCycleDays: 30,
  hierarchyLevel: 1,
  isActive: true,
  ...overrides,
});

const buildSubscription = (overrides = {}) => ({
  id: "subscription-id",
  userId: "507f1f77bcf86cd799439011",
  planId: "plan-monthly-id",
  planCode: SUBSCRIPTION_PLAN_CODES.MONTHLY,
  planNameSnapshot: "Monthly",
  planPriceInrSnapshot: 179,
  status: SUBSCRIPTION_STATUSES.ACTIVE,
  startAt: new Date("2026-04-01T00:00:00.000Z"),
  endAt: new Date("2026-05-01T00:00:00.000Z"),
  metadata: {},
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  ...overrides,
});

describe("Subscriptions Service", () => {
  it("updates plan values through admin plan management", async () => {
    const updatedPlan = buildPlan({
      id: "plan-quarterly-id",
      code: SUBSCRIPTION_PLAN_CODES.QUARTERLY,
      name: "Quarterly",
      priceInr: 549,
      billingCycleDays: 90,
      hierarchyLevel: 2,
    });

    vi.spyOn(subscriptionsRepository, "updatePlanById").mockResolvedValue(
      updatedPlan,
    );

    const result = await subscriptionsService.adminUpdatePlan(
      "plan-quarterly-id",
      {
        priceInr: 549,
        billingCycleDays: 90,
      },
    );

    expect(result.code).toBe(SUBSCRIPTION_PLAN_CODES.QUARTERLY);
    expect(result.priceInr).toBe(549);
    expect(result.billingCycleDays).toBe(90);
  });

  it("computes proration preview for valid monthly to yearly upgrade", async () => {
    const subscription = buildSubscription({
      startAt: new Date("2026-04-12T00:00:00.000Z"),
      endAt: new Date("2026-05-12T00:00:00.000Z"),
      planPriceInrSnapshot: 179,
    });

    const currentPlan = buildPlan({
      id: "plan-monthly-id",
      code: SUBSCRIPTION_PLAN_CODES.MONTHLY,
      priceInr: 179,
      hierarchyLevel: 1,
      billingCycleDays: 30,
    });

    const targetPlan = buildPlan({
      id: "plan-yearly-id",
      code: SUBSCRIPTION_PLAN_CODES.YEARLY,
      name: "Yearly",
      priceInr: 1999,
      hierarchyLevel: 3,
      billingCycleDays: 365,
    });

    vi.spyOn(subscriptionsRepository, "findSubscriptionById").mockResolvedValue(
      subscription,
    );
    vi.spyOn(subscriptionsRepository, "findPlanById").mockResolvedValue(
      currentPlan,
    );
    vi.spyOn(subscriptionsRepository, "findPlanByCode").mockResolvedValue(
      targetPlan,
    );

    const result = await subscriptionsService.calculateUpgradePreviewForUser({
      subscriptionId: subscription.id,
      requesterUserId: subscription.userId,
      requesterRole: "user",
      targetPlanCode: SUBSCRIPTION_PLAN_CODES.YEARLY,
    });

    expect(result.currentPlan.code).toBe(SUBSCRIPTION_PLAN_CODES.MONTHLY);
    expect(result.targetPlan.code).toBe(SUBSCRIPTION_PLAN_CODES.YEARLY);
    expect(result.proration.unusedValueInr).toBeGreaterThanOrEqual(0);
    expect(result.proration.proratedUpgradeChargeInr).toBeGreaterThan(0);
    expect(result.proration.proratedUpgradeChargeInr).toBeLessThan(1999);
  });

  it("cancels subscription immediately and records cancellation event", async () => {
    const activeSubscription = buildSubscription({
      id: "subscription-cancel-id",
      status: SUBSCRIPTION_STATUSES.ACTIVE,
    });

    const canceledSubscription = buildSubscription({
      ...activeSubscription,
      status: SUBSCRIPTION_STATUSES.CANCELED,
      autoRenew: false,
      canceledAt: new Date("2026-04-22T00:00:00.000Z"),
      endAt: new Date("2026-04-22T00:00:00.000Z"),
    });

    vi.spyOn(subscriptionsRepository, "findSubscriptionById").mockResolvedValue(
      activeSubscription,
    );
    vi.spyOn(
      subscriptionsRepository,
      "updateSubscriptionById",
    ).mockResolvedValue(canceledSubscription);
    vi.spyOn(
      subscriptionsRepository,
      "createCancellationEvent",
    ).mockResolvedValue({
      id: "cancel-event-id",
      subscriptionId: activeSubscription.id,
      userId: activeSubscription.userId,
      canceledAt: canceledSubscription.canceledAt,
      reason: "user requested",
      immediate: true,
      statusBeforeCancel: SUBSCRIPTION_STATUSES.ACTIVE,
      statusAfterCancel: SUBSCRIPTION_STATUSES.CANCELED,
      actorId: activeSubscription.userId,
      metadata: {},
      createdAt: canceledSubscription.canceledAt,
    });
    vi.spyOn(subscriptionsRepository, "createHistory").mockResolvedValue({
      id: "history-1",
    });
    vi.spyOn(usersRepository, "updateById").mockResolvedValue({});

    const result = await subscriptionsService.cancelSubscriptionForUser({
      subscriptionId: activeSubscription.id,
      requesterUserId: activeSubscription.userId,
      requesterRole: "user",
      reason: "user requested",
    });

    expect(result.subscription.status).toBe(SUBSCRIPTION_STATUSES.CANCELED);
    expect(result.subscription.autoRenew).toBe(false);
    expect(result.cancellationEvent.immediate).toBe(true);
  });

  it("moves renewal failure into grace period with configured duration", async () => {
    const activeSubscription = buildSubscription({
      id: "subscription-grace-id",
      status: SUBSCRIPTION_STATUSES.ACTIVE,
    });

    const graceSubscription = buildSubscription({
      ...activeSubscription,
      status: SUBSCRIPTION_STATUSES.GRACE_PERIOD,
      gracePeriodEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    vi.spyOn(subscriptionsRepository, "findSubscriptionById").mockResolvedValue(
      activeSubscription,
    );
    vi.spyOn(subscriptionsRepository, "getConfig").mockResolvedValue({
      gracePeriodDays: 7,
      mandatoryCharityPercentage: 5,
      currency: "INR",
      metadata: {},
    });
    const updateSpy = vi
      .spyOn(subscriptionsRepository, "updateSubscriptionById")
      .mockResolvedValue(graceSubscription);
    const createHistorySpy = vi
      .spyOn(subscriptionsRepository, "createHistory")
      .mockResolvedValue({ id: "history-renewal-failed" });
    vi.spyOn(usersRepository, "updateById").mockResolvedValue({});

    const result = await subscriptionsService.markRenewalFailed(
      activeSubscription.id,
      "card declined",
      {
        actorId: "507f1f77bcf86cd799439012",
        role: "admin",
      },
    );

    const updatePayload = updateSpy.mock.calls[0][1];

    expect(result.status).toBe(SUBSCRIPTION_STATUSES.GRACE_PERIOD);
    expect(updatePayload.status).toBe(SUBSCRIPTION_STATUSES.GRACE_PERIOD);
    expect(updatePayload.gracePeriodEndsAt).toBeInstanceOf(Date);
    expect(createHistorySpy.mock.calls[0][0].eventType).toBe(
      SUBSCRIPTION_HISTORY_EVENT_TYPES.RENEWAL_FAILED,
    );
  });

  it("expires subscriptions whose grace period has elapsed", async () => {
    const runAt = new Date("2026-04-22T12:00:00.000Z");

    const dueSubscriptions = [
      buildSubscription({
        id: "subscription-expire-1",
        status: SUBSCRIPTION_STATUSES.GRACE_PERIOD,
        gracePeriodEndsAt: new Date("2026-04-20T00:00:00.000Z"),
      }),
      buildSubscription({
        id: "subscription-expire-2",
        status: SUBSCRIPTION_STATUSES.GRACE_PERIOD,
        gracePeriodEndsAt: new Date("2026-04-21T00:00:00.000Z"),
      }),
    ];

    vi.spyOn(
      subscriptionsRepository,
      "findExpiredGraceSubscriptions",
    ).mockResolvedValue(dueSubscriptions);
    vi.spyOn(subscriptionsRepository, "updateSubscriptionById")
      .mockResolvedValueOnce({
        ...dueSubscriptions[0],
        status: SUBSCRIPTION_STATUSES.EXPIRED,
        endAt: dueSubscriptions[0].gracePeriodEndsAt,
      })
      .mockResolvedValueOnce({
        ...dueSubscriptions[1],
        status: SUBSCRIPTION_STATUSES.EXPIRED,
        endAt: dueSubscriptions[1].gracePeriodEndsAt,
      });
    vi.spyOn(subscriptionsRepository, "createHistory").mockResolvedValue({
      id: "history-expired",
    });
    vi.spyOn(usersRepository, "updateById").mockResolvedValue({});

    const result = await subscriptionsService.processGracePeriodExpirations(
      runAt,
      {
        actorId: "507f1f77bcf86cd799439012",
        role: "admin",
      },
    );

    expect(result.expiredCount).toBe(2);
    expect(
      result.expiredSubscriptions.every(
        (item) => item.status === SUBSCRIPTION_STATUSES.EXPIRED,
      ),
    ).toBe(true);
  });

  it("rejects invalid downgrade upgrade attempt", async () => {
    const subscription = buildSubscription({
      id: "subscription-invalid-upgrade-id",
      planId: "plan-yearly-id",
      planCode: SUBSCRIPTION_PLAN_CODES.YEARLY,
      status: SUBSCRIPTION_STATUSES.ACTIVE,
    });

    const currentPlan = buildPlan({
      id: "plan-yearly-id",
      code: SUBSCRIPTION_PLAN_CODES.YEARLY,
      name: "Yearly",
      priceInr: 1999,
      billingCycleDays: 365,
      hierarchyLevel: 3,
    });

    const targetPlan = buildPlan({
      id: "plan-monthly-id",
      code: SUBSCRIPTION_PLAN_CODES.MONTHLY,
      name: "Monthly",
      priceInr: 179,
      billingCycleDays: 30,
      hierarchyLevel: 1,
    });

    vi.spyOn(subscriptionsRepository, "findSubscriptionById").mockResolvedValue(
      subscription,
    );
    vi.spyOn(subscriptionsRepository, "findPlanById").mockResolvedValue(
      currentPlan,
    );
    vi.spyOn(subscriptionsRepository, "findPlanByCode").mockResolvedValue(
      targetPlan,
    );

    await expect(
      subscriptionsService.calculateUpgradePreviewForUser({
        subscriptionId: subscription.id,
        requesterUserId: subscription.userId,
        requesterRole: "user",
        targetPlanCode: SUBSCRIPTION_PLAN_CODES.MONTHLY,
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
