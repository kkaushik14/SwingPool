import { describe, expect, it, vi } from "vitest";

import { adminRepository } from "../src/components/admin/admin.repository.js";
import { adminService } from "../src/components/admin/admin.service.js";
import { drawsService } from "../src/components/draws/draws.service.js";

const context = {
  actorId: "507f1f77bcf86cd799439051",
  role: "admin",
  requestId: "req-admin-guard-1",
};

describe("Admin Manual Override Safeguards", () => {
  it("rejects manual payment adjustment without required reason", async () => {
    await expect(
      adminService.manualAdjustPayment(
        "507f1f77bcf86cd799439031",
        {
          state: "failed",
        },
        context,
      ),
    ).rejects.toThrow("reason");
  });

  it("rejects donation manual adjustment when no mutable fields are provided", async () => {
    vi.spyOn(adminRepository, "findDonationById").mockResolvedValue({
      id: "507f1f77bcf86cd799439032",
      status: "processing",
    });

    await expect(
      adminService.manualAdjustDonation(
        "507f1f77bcf86cd799439032",
        {
          reason: "Operator attempted adjustment without any actual changes.",
        },
        context,
      ),
    ).rejects.toThrow("At least one donation field");
  });

  it("preserves draw publish immutability on admin update attempts", async () => {
    vi.spyOn(adminRepository, "findDrawById").mockResolvedValue({
      id: "507f1f77bcf86cd799439033",
      status: "published",
    });

    vi.spyOn(drawsService, "updateSnapshot").mockRejectedValue(
      new Error("Published draw snapshots are immutable."),
    );

    await expect(
      adminService.updateDraw(
        "507f1f77bcf86cd799439033",
        {
          drawAt: new Date("2026-05-01T00:00:00.000Z"),
          reason: "Attempting post-publication correction.",
        },
        context,
      ),
    ).rejects.toThrow("immutable");
  });
});
