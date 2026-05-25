import { describe, expect, it, vi } from "vitest";

import * as sharedServices from "../src/services/index.js";
import { SCORES_STATUSES } from "../src/components/scores/scores.enums.js";
import { scoresRepository } from "../src/components/scores/scores.repository.js";
import { scoresService } from "../src/components/scores/scores.service.js";

const USER_ID = "507f1f77bcf86cd799439011";

const buildScore = (overrides = {}) => ({
  id: "507f1f77bcf86cd799439101",
  _id: "507f1f77bcf86cd799439101",
  userId: USER_ID,
  playedDate: new Date("2026-04-22T05:30:00.000Z"),
  playedDateKey: "2026-04-22",
  value: 25,
  contestNumber: 101,
  status: SCORES_STATUSES.ACTIVE,
  source: "user",
  submittedAt: new Date("2026-04-22T10:30:00.000Z"),
  submissionLocalDateKey: "2026-04-22",
  isBackdated: false,
  confirmedAt: new Date("2026-04-22T10:30:00.000Z"),
  confirmedBy: USER_ID,
  adminEditCount: 0,
  lastAdminEditedAt: null,
  lastAdminEditedBy: null,
  lastAdminEditReason: "",
  metadata: {},
  createdAt: new Date("2026-04-22T10:30:00.000Z"),
  updatedAt: new Date("2026-04-22T10:30:00.000Z"),
  ...overrides,
});

describe("Scores Service", () => {
  it("keeps user-submitted scores immutable after confirmation", async () => {
    vi.spyOn(scoresRepository, "findByUserAndId").mockResolvedValue(
      buildScore(),
    );

    await expect(
      scoresService.updateForUser(USER_ID, "507f1f77bcf86cd799439101", {
        value: 20,
      }),
    ).rejects.toThrow("immutable");
  });

  it("stores backdated score and marks it excluded from competition qualification", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T06:00:00.000Z"));

    const createSpy = vi
      .spyOn(scoresRepository, "create")
      .mockImplementation(async (payload) => {
        return buildScore({
          ...payload,
          id: "507f1f77bcf86cd799439102",
          _id: "507f1f77bcf86cd799439102",
        });
      });
    const qualifyingSpy = vi
      .spyOn(scoresRepository, "listQualifyingByUser")
      .mockResolvedValue([]);

    const created = await scoresService.createForUser(USER_ID, {
      playedDate: new Date("2026-04-21T06:00:00.000Z"),
      value: 30,
      contestNumber: 200,
    });

    expect(created.isBackdated).toBe(true);
    expect(qualifyingSpy).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isBackdated: true,
        value: 30,
        contestNumber: 200,
      }),
    );

    vi.useRealTimers();
  });

  it("rejects duplicate contest numbers within latest five qualifying competition scores", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T06:00:00.000Z"));

    vi.spyOn(scoresRepository, "listQualifyingByUser").mockResolvedValue([
      buildScore({
        id: "1",
        contestNumber: 10,
        submittedAt: new Date("2026-04-22T05:00:00.000Z"),
      }),
      buildScore({
        id: "2",
        contestNumber: 11,
        submittedAt: new Date("2026-04-21T05:00:00.000Z"),
      }),
      buildScore({
        id: "3",
        contestNumber: 12,
        submittedAt: new Date("2026-04-20T05:00:00.000Z"),
      }),
      buildScore({
        id: "4",
        contestNumber: 13,
        submittedAt: new Date("2026-04-19T05:00:00.000Z"),
      }),
    ]);
    const createSpy = vi
      .spyOn(scoresRepository, "create")
      .mockResolvedValue(buildScore());

    await expect(
      scoresService.createForUser(USER_ID, {
        playedDate: new Date("2026-04-22T04:00:00.000Z"),
        value: 21,
        contestNumber: 12,
      }),
    ).rejects.toThrow("Duplicate contest numbers");

    expect(createSpy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("retains full score history and returns paginated history view", async () => {
    const records = [
      buildScore({ id: "history-1", contestNumber: 1001, isBackdated: false }),
      buildScore({ id: "history-2", contestNumber: 1002, isBackdated: true }),
    ];

    vi.spyOn(scoresRepository, "listByUserPaginated").mockResolvedValue(
      records,
    );
    vi.spyOn(scoresRepository, "countByUser").mockResolvedValue(8);

    const result = await scoresService.listHistoryForUser(USER_ID, {
      page: 1,
      pageSize: 2,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].contestNumber).toBe(1001);
    expect(result.items[1].isBackdated).toBe(true);
    expect(result.meta.totalItems).toBe(8);
    expect(result.meta.totalPages).toBe(4);
  });

  it("applies pagination parameters correctly for history listing", async () => {
    const listSpy = vi
      .spyOn(scoresRepository, "listByUserPaginated")
      .mockResolvedValue([]);
    vi.spyOn(scoresRepository, "countByUser").mockResolvedValue(5);

    await scoresService.listHistoryForUser(USER_ID, {
      page: 2,
      pageSize: 2,
      sortBy: "submittedAt",
      sortOrder: "desc",
    });

    expect(listSpy).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        skip: 2,
        limit: 2,
      }),
    );
  });

  it("derives eligibility from latest five qualifying submissions by submission timestamp", async () => {
    vi.spyOn(scoresRepository, "listQualifyingByUser").mockResolvedValue([
      buildScore({
        id: "q1",
        contestNumber: 901,
        submittedAt: new Date("2026-04-22T10:00:00.000Z"),
      }),
      buildScore({
        id: "q2",
        contestNumber: 902,
        submittedAt: new Date("2026-04-21T10:00:00.000Z"),
      }),
      buildScore({
        id: "q3",
        contestNumber: 903,
        submittedAt: new Date("2026-04-20T10:00:00.000Z"),
      }),
      buildScore({
        id: "q4",
        contestNumber: 904,
        submittedAt: new Date("2026-04-19T10:00:00.000Z"),
      }),
      buildScore({
        id: "q5",
        contestNumber: 905,
        submittedAt: new Date("2026-04-18T10:00:00.000Z"),
      }),
    ]);
    vi.spyOn(scoresRepository, "countQualifyingByUser").mockResolvedValue(9);

    const result =
      await scoresService.getCompetitionEligibilityForUser(USER_ID);

    expect(result.qualifyingCount).toBe(5);
    expect(result.isEligible).toBe(true);
    expect(result.scores.map((item) => item.contestNumber)).toEqual([
      901, 902, 903, 904, 905,
    ]);
  });

  it("allows admin score edits and writes full audit log metadata", async () => {
    const existing = buildScore({
      id: "507f1f77bcf86cd799439150",
      _id: "507f1f77bcf86cd799439150",
      contestNumber: 100,
      value: 18,
      submittedAt: new Date("2026-04-22T05:00:00.000Z"),
    });

    vi.spyOn(scoresRepository, "findById").mockResolvedValue(existing);
    vi.spyOn(scoresRepository, "listQualifyingByUser").mockResolvedValue([
      buildScore({ id: "q11", contestNumber: 101 }),
      buildScore({ id: "q12", contestNumber: 102 }),
      buildScore({ id: "q13", contestNumber: 103 }),
      buildScore({ id: "q14", contestNumber: 104 }),
    ]);

    vi.spyOn(scoresRepository, "updateById").mockResolvedValue(
      buildScore({
        ...existing,
        value: 20,
        contestNumber: 100,
        adminEditCount: 1,
        lastAdminEditReason: "Data correction from scorecard image.",
      }),
    );

    const auditSpy = vi
      .spyOn(sharedServices, "logAuditEvent")
      .mockImplementation(() => {});

    const result = await scoresService.adminUpdateScore(
      existing.id,
      {
        value: 20,
        editReason: "Data correction from scorecard image.",
      },
      {
        actorId: "507f1f77bcf86cd799439012",
        role: "admin",
        requestId: "req-score-admin-edit",
      },
    );

    expect(result.value).toBe(20);
    expect(result.adminEditCount).toBe(1);
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "scores.admin.update",
      }),
    );
  });
});
