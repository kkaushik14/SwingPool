import { config } from "../config/index.js";
import { drawsRepository } from "../components/draws/draws.repository.js";
import { drawsService } from "../components/draws/draws.service.js";

import { buildJobRunKey, runIdempotentJob } from "./job-runner.js";
import { JOB_NAMES } from "./jobs.enums.js";

export const runDrawExecutionJob = async ({
  at = new Date(),
  requestId = null,
  runKey = buildJobRunKey({
    at,
    intervalMs: config.jobs.drawExecutionIntervalMs,
  }),
} = {}) => {
  return runIdempotentJob({
    jobName: JOB_NAMES.DRAW_EXECUTION,
    runKey,
    requestId,
    metadata: {
      at,
    },
    handler: async ({ requestContext }) => {
      const dueDraws = await drawsRepository.findDueUnpublishedDraws(at);
      const publishedDrawIds = [];
      const failedDrawIds = [];

      for (const draw of dueDraws) {
        try {
          await drawsService.publishDraw(draw.id, requestContext);
          publishedDrawIds.push(String(draw.id));
        } catch (_error) {
          failedDrawIds.push(String(draw.id));
        }
      }

      return {
        dueCount: dueDraws.length,
        publishedCount: publishedDrawIds.length,
        failedCount: failedDrawIds.length,
        publishedDrawIds,
        failedDrawIds,
      };
    },
  });
};
