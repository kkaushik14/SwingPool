import { config } from "../config/index.js";
import { DRAW_SNAPSHOT_STATUSES } from "../components/draws/draws.enums.js";
import { drawsRepository } from "../components/draws/draws.repository.js";
import { drawsService } from "../components/draws/draws.service.js";

import { buildJobRunKey, runIdempotentJob } from "./job-runner.js";
import { JOB_NAMES } from "./jobs.enums.js";

const buildDrawMonthKey = (year, month) =>
  `${year}-${String(month).padStart(2, "0")}`;

export const runMonthlyDrawJob = async ({
  at = new Date(),
  requestId = null,
  runKey = buildJobRunKey({
    at,
    intervalMs: config.jobs.monthlyDrawPreparationIntervalMs,
  }),
} = {}) => {
  return runIdempotentJob({
    jobName: JOB_NAMES.MONTHLY_DRAW_PREPARATION,
    runKey,
    requestId,
    metadata: {
      at,
    },
    handler: async ({ requestContext }) => {
      const month = at.getUTCMonth() + 1;
      const year = at.getUTCFullYear();
      const drawMonthKey = buildDrawMonthKey(year, month);
      let snapshot = await drawsRepository.findByMonthKey(drawMonthKey);
      let createdSnapshot = false;

      if (!snapshot) {
        snapshot = await drawsService.createSnapshot(
          {
            month,
            year,
          },
          requestContext,
        );
        createdSnapshot = true;
      }

      if (snapshot.status !== DRAW_SNAPSHOT_STATUSES.PUBLISHED) {
        await drawsService.generateEntries(snapshot.id, requestContext);
      }

      return {
        drawId: snapshot.id,
        drawMonthKey,
        month,
        year,
        createdSnapshot,
        drawStatus: snapshot.status,
      };
    },
  });
};
