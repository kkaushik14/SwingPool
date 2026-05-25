import { describe, expect, it, vi } from "vitest";

import { auditComponentService } from "../src/components/audit/index.js";
import { adminRepository } from "../src/components/admin/admin.repository.js";
import { adminService } from "../src/components/admin/admin.service.js";
import { SUBSCRIPTION_STATUSES } from "../src/components/subscriptions/subscriptions.enums.js";
import { usersService } from "../src/components/users/users.service.js";

const context = {
  actorId: "507f1f77bcf86cd799439050",
  role: "admin",
  requestId: "req-admin-audit-1",
};

describe("Admin Audit Logging", () => {
  it("records before/after snapshots and reason for manual subscription adjustments", async () => {
    const before = {
      id: "507f1f77bcf86cd799439021",
      userId: "507f1f77bcf86cd799439011",
      planCode: "monthly",
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      metadata: { source: "seed" },
    };

    const after = {
      ...before,
      status: SUBSCRIPTION_STATUSES.CANCELED,
      canceledAt: new Date("2026-04-22T00:00:00.000Z"),
      metadata: { source: "seed", manual: true },
    };

    vi.spyOn(adminRepository, "findSubscriptionById").mockResolvedValue(before);
    vi.spyOn(adminRepository, "updateSubscriptionById").mockResolvedValue(
      after,
    );
    vi.spyOn(adminRepository, "createSubscriptionHistory").mockResolvedValue({
      id: "history-1",
    });
    vi.spyOn(usersService, "adminUpdateUser").mockResolvedValue({
      id: before.userId,
    });

    const auditSpy = vi
      .spyOn(auditComponentService, "recordEvent")
      .mockResolvedValue(null);

    await adminService.manualAdjustSubscription(
      before.id,
      {
        status: SUBSCRIPTION_STATUSES.CANCELED,
        reason: "Fraud review completed and subscription closed.",
        metadata: {
          manual: true,
        },
      },
      context,
    );

    expect(auditSpy).toHaveBeenCalled();

    const auditPayload = auditSpy.mock.calls[auditSpy.mock.calls.length - 1][0];

    expect(auditPayload.action).toBe("admin.subscriptions.manual_adjustment");
    expect(auditPayload.actorId).toBe(context.actorId);
    expect(auditPayload.entity).toBe("Subscription");
    expect(auditPayload.requestId).toBe(context.requestId);
    expect(auditPayload.metadata.reason).toContain("Fraud review");
    expect(auditPayload.metadata.before.status).toBe(
      SUBSCRIPTION_STATUSES.ACTIVE,
    );
    expect(auditPayload.metadata.after.status).toBe(
      SUBSCRIPTION_STATUSES.CANCELED,
    );
  });
});
