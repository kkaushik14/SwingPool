import { describe, expect, it, vi } from "vitest";

import { charitiesService } from "../src/components/charities/charities.service.js";
import {
  CHARITIES_STATUSES,
  CHARITY_SELECTION_STATUSES,
} from "../src/components/charities/charities.enums.js";
import { CharityAllocationLedgerModel } from "../src/components/charities/charity-allocation-ledger.model.js";
import { charitiesRepository } from "../src/components/charities/charities.repository.js";

describe("Charity Historical Immutability", () => {
  it("rejects mutation on immutable charity allocation ledger entries", async () => {
    await expect(
      CharityAllocationLedgerModel.updateOne({}, { $set: { amountMinor: 10 } }),
    ).rejects.toThrow("immutable");

    await expect(CharityAllocationLedgerModel.deleteOne({})).rejects.toThrow(
      "immutable",
    );
  });

  it("changes selection for future payments by superseding active row and creating a new row", async () => {
    const userId = "507f1f77bcf86cd799439011";
    const previousSelection = {
      id: "selection-old",
      charityId: "507f1f77bcf86cd799439021",
      status: CHARITY_SELECTION_STATUSES.ACTIVE,
      effectiveFrom: new Date("2026-04-01T00:00:00.000Z"),
      effectiveTo: null,
      metadata: {},
    };

    const nextSelection = {
      id: "selection-new",
      userId,
      charityId: "507f1f77bcf86cd799439022",
      status: CHARITY_SELECTION_STATUSES.ACTIVE,
      effectiveFrom: new Date("2026-04-22T00:00:00.000Z"),
      effectiveTo: null,
      changedBy: userId,
      reason: "update preference",
      metadata: {},
      createdAt: new Date("2026-04-22T00:00:00.000Z"),
      updatedAt: new Date("2026-04-22T00:00:00.000Z"),
    };

    vi.spyOn(charitiesRepository, "findById").mockResolvedValue({
      id: nextSelection.charityId,
      status: CHARITIES_STATUSES.ACTIVE,
    });

    const activeSpy = vi
      .spyOn(charitiesRepository, "getActiveSelectionByUserId")
      .mockResolvedValue(previousSelection);

    const supersedeSpy = vi
      .spyOn(charitiesRepository, "supersedeActiveSelection")
      .mockResolvedValue({ modifiedCount: 1 });

    const createSpy = vi
      .spyOn(charitiesRepository, "createSelection")
      .mockResolvedValue(nextSelection);

    const result = await charitiesService.setMySelection(
      userId,
      {
        charityId: nextSelection.charityId,
        reason: "update preference",
      },
      {
        actorId: userId,
        role: "user",
      },
    );

    expect(activeSpy).toHaveBeenCalledWith(userId);
    expect(supersedeSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledTimes(1);

    const createPayload = createSpy.mock.calls[0][0];

    expect(createPayload.userId).toBe(userId);
    expect(createPayload.charityId).toBe(nextSelection.charityId);
    expect(createPayload.status).toBe(CHARITY_SELECTION_STATUSES.ACTIVE);
    expect(createPayload.effectiveTo).toBe(null);

    expect(result.id).toBe(nextSelection.id);
    expect(result.charityId).toBe(nextSelection.charityId);
    expect(result.status).toBe(CHARITY_SELECTION_STATUSES.ACTIVE);
  });
});
