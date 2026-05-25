import { describe, expect, it, vi } from "vitest";

import { winnersRepository } from "../src/components/winners/winners.repository.js";
import { drawsRepository } from "../src/components/draws/draws.repository.js";
import { DRAW_SNAPSHOT_STATUSES } from "../src/components/draws/draws.enums.js";
import { drawsService } from "../src/components/draws/draws.service.js";

const DRAW_ID = "507f1f77bcf86cd799439221";

const buildDraw = (overrides = {}) => ({
  id: DRAW_ID,
  _id: DRAW_ID,
  drawMonthKey: "2026-04",
  month: 4,
  year: 2026,
  mode: "random",
  drawAt: new Date("2026-04-30T18:00:00.000Z"),
  eligibilityCutoffAt: new Date("2026-04-24T00:00:00.000Z"),
  prizePoolSnapshotAt: new Date("2026-04-30T18:00:00.000Z"),
  numbersPerDraw: 5,
  numberRangeMin: 1,
  numberRangeMax: 5,
  status: DRAW_SNAPSHOT_STATUSES.DRAFT,
  metadata: {},
  createdAt: new Date("2026-04-01T00:00:00.000Z"),
  updatedAt: new Date("2026-04-01T00:00:00.000Z"),
  ...overrides,
});

const buildScore = (overrides = {}) => ({
  id: "score-id",
  value: 10,
  ...overrides,
});

const buildSubscription = (overrides = {}) => ({
  id: "sub-id",
  userId: "507f1f77bcf86cd799439011",
  status: "active",
  startAt: new Date("2026-04-10T00:00:00.000Z"),
  canceledAt: null,
  endAt: null,
  ...overrides,
});

const buildEntry = (overrides = {}) => ({
  id: "entry-id",
  drawId: DRAW_ID,
  userId: "507f1f77bcf86cd799439011",
  contestNumbers: [1, 2, 3, 4, 6],
  ...overrides,
});

describe("Draws Service", () => {
  it("generates unique random numbers within 1..45", () => {
    const numbers = drawsService.generateRandomUniqueNumbers({
      min: 1,
      max: 45,
      count: 5,
    });

    expect(numbers).toHaveLength(5);
    expect(new Set(numbers).size).toBe(5);
    expect(
      numbers.every(
        (item) => Number.isInteger(item) && item >= 1 && item <= 45,
      ),
    ).toBe(true);
  });

  it("enforces cutoff and lapsed filters and keeps one entry per user per month", async () => {
    const draw = buildDraw();

    vi.spyOn(drawsRepository, "findById").mockResolvedValue(draw);
    vi.spyOn(
      drawsRepository,
      "findSubscriptionCandidatesForDraw",
    ).mockResolvedValue([
      buildSubscription({
        id: "sub-eligible",
        userId: "507f1f77bcf86cd799439011",
      }),
      buildSubscription({
        id: "sub-duplicate",
        userId: "507f1f77bcf86cd799439011",
      }),
      buildSubscription({
        id: "sub-missed-cutoff",
        userId: "507f1f77bcf86cd799439012",
        startAt: new Date("2026-04-26T00:00:00.000Z"),
      }),
      buildSubscription({
        id: "sub-lapsed",
        userId: "507f1f77bcf86cd799439013",
        canceledAt: new Date("2026-04-29T00:00:00.000Z"),
      }),
    ]);

    vi.spyOn(drawsRepository, "findEntryByDrawAndUser").mockResolvedValue(null);
    vi.spyOn(drawsRepository, "listQualifyingScoresForUser").mockResolvedValue([
      buildScore({ id: "s1", value: 1 }),
      buildScore({ id: "s2", value: 2 }),
      buildScore({ id: "s3", value: 3 }),
      buildScore({ id: "s4", value: 4 }),
      buildScore({ id: "s5", value: 5 }),
    ]);

    const createEntrySpy = vi
      .spyOn(drawsRepository, "createEntry")
      .mockResolvedValue(
        buildEntry({
          contestNumbers: [1, 2, 3, 4, 5],
        }),
      );
    vi.spyOn(drawsRepository, "countEntriesByDraw").mockResolvedValue(1);
    vi.spyOn(drawsRepository, "updateById").mockResolvedValue(
      buildDraw({
        status: DRAW_SNAPSHOT_STATUSES.ENTRIES_LOCKED,
        totalEntries: 1,
      }),
    );

    const generated = await drawsService.generateEntries(draw.id, {
      actorId: "507f1f77bcf86cd799439099",
      role: "admin",
    });

    expect(generated.totalEntries).toBe(1);
    expect(generated.createdEntries).toHaveLength(1);
    expect(createEntrySpy).toHaveBeenCalledTimes(1);
    expect(
      generated.skippedUsers.some(
        (item) => item.reason === "missed_eligibility_cutoff",
      ),
    ).toBe(true);
    expect(
      generated.skippedUsers.some(
        (item) => item.reason === "lapsed_on_draw_day",
      ),
    ).toBe(true);
  });

  it("rejects snapshot updates after draw publication (publish immutability)", async () => {
    vi.spyOn(drawsRepository, "findById").mockResolvedValue(
      buildDraw({
        status: DRAW_SNAPSHOT_STATUSES.PUBLISHED,
        publishedAt: new Date("2026-04-30T18:00:00.000Z"),
        publishedResultId: "507f1f77bcf86cd799439311",
      }),
    );

    await expect(
      drawsService.updateSnapshot(DRAW_ID, {
        drawAt: new Date("2026-04-30T19:00:00.000Z"),
      }),
    ).rejects.toThrow("immutable");
  });

  it("rolls over full 5-match jackpot when unclaimed", async () => {
    const draw = buildDraw();

    vi.spyOn(drawsRepository, "findById").mockResolvedValue(draw);
    vi.spyOn(drawsRepository, "getConfig").mockResolvedValue({
      id: "draw-config-1",
      mode: "random",
      numberRangeMin: 1,
      numberRangeMax: 5,
      numbersPerDraw: 5,
      eligibilityCutoffDaysBeforeMonthEnd: 7,
      proofDeadlineDays: 23,
      maxProofFiles: 2,
      prizeDistribution: {
        match3Percentage: 20,
        match4Percentage: 30,
        match5Percentage: 50,
      },
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    });

    vi.spyOn(drawsRepository, "listEntriesByDraw").mockResolvedValue([
      buildEntry({ id: "entry-1", contestNumbers: [1, 2, 3, 4, 6] }),
    ]);

    vi.spyOn(drawsRepository, "createPublishedResult").mockResolvedValue({
      id: "result-1",
      drawId: draw.id,
      mode: draw.mode,
      winningNumbers: [1, 2, 3, 4, 5],
      publishedBy: null,
      publishedAt: new Date("2026-04-30T18:00:00.000Z"),
      metadata: {},
      createdAt: new Date("2026-04-30T18:00:00.000Z"),
    });

    vi.spyOn(
      drawsRepository,
      "aggregateMonthlyPrizePoolMinor",
    ).mockResolvedValue(10000);
    vi.spyOn(
      drawsRepository,
      "findLatestPrizePoolBeforeDate",
    ).mockResolvedValue({
      id: "pool-prev",
      jackpotCarryOutMinor: 2500,
    });
    vi.spyOn(
      drawsRepository,
      "sumUnappliedManualJackpotCredits",
    ).mockResolvedValue(500);
    vi.spyOn(
      drawsRepository,
      "markManualJackpotCreditsApplied",
    ).mockResolvedValue({ modifiedCount: 2 });
    vi.spyOn(winnersRepository, "createMany").mockResolvedValue([]);

    vi.spyOn(drawsRepository, "createPrizePool").mockImplementation(
      async (payload) => ({
        id: "pool-1",
        ...payload,
        createdAt: new Date("2026-04-30T18:00:00.000Z"),
        updatedAt: new Date("2026-04-30T18:00:00.000Z"),
      }),
    );

    vi.spyOn(drawsRepository, "createJackpotLedgerEntry").mockResolvedValue({
      id: "ledger-1",
    });
    vi.spyOn(drawsRepository, "updateById").mockResolvedValue(
      buildDraw({
        status: DRAW_SNAPSHOT_STATUSES.PUBLISHED,
        publishedResultId: "result-1",
        prizePoolId: "pool-1",
        publishedAt: new Date("2026-04-30T18:00:00.000Z"),
      }),
    );

    const published = await drawsService.publishDraw(draw.id, {
      actorId: "507f1f77bcf86cd799439099",
      role: "admin",
    });

    expect(published.prizePool.subscriptionPrizePoolMinor).toBe(10000);
    expect(published.prizePool.jackpotCarryInMinor).toBe(2500);
    expect(published.prizePool.manualJackpotAddedMinor).toBe(500);
    expect(published.prizePool.bucket5Minor).toBe(8000);
    expect(published.prizePool.winners5Count).toBe(0);
    expect(published.prizePool.jackpotCarryOutMinor).toBe(8000);
  });
});
