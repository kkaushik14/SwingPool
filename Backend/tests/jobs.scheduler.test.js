import { describe, expect, it } from "vitest";

import { shouldStartJobScheduler } from "../src/jobs/index.js";

describe("Job Scheduler", () => {
  it("requires both jobs to be enabled and the database to be connected", () => {
    expect(
      shouldStartJobScheduler({
        jobsEnabled: true,
        databaseConnected: true,
      }),
    ).toBe(true);

    expect(
      shouldStartJobScheduler({
        jobsEnabled: false,
        databaseConnected: true,
      }),
    ).toBe(false);

    expect(
      shouldStartJobScheduler({
        jobsEnabled: true,
        databaseConnected: false,
      }),
    ).toBe(false);
  });
});
