import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { CharitySelectionModel } from "../src/components/charities/charity-selection.model.js";
import { CharityModel } from "../src/components/charities/charities.model.js";
import { ScoreModel } from "../src/components/scores/scores.model.js";
import { SubscriptionPlanModel } from "../src/components/subscriptions/subscription-plan.model.js";
import { SubscriptionModel } from "../src/components/subscriptions/subscriptions.model.js";
import { UserProfileModel } from "../src/components/users/users-profile.model.js";
import { UserModel } from "../src/components/users/users.model.js";
import { AdminUserSeeder } from "../src/database/seeds/seeders/admin-user.seeder.js";
import { SampleDataSeeder } from "../src/database/seeds/seeders/sample-data.seeder.js";
import * as utils from "../src/utils/index.js";

const createLogger = () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const unsetEnv = (...keys) => {
  for (const key of keys) {
    delete process.env[key];
  }
};

const writeSampleSeedSource = () => {
  const sourcePath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "swing-pool-seed-")),
    "sample-seed.json",
  );

  fs.writeFileSync(
    sourcePath,
    JSON.stringify(
      {
        pendingUser: {
          email: "demo.pending@swingpool.test",
          password: "DemoUser@12345",
          displayName: "Demo Pending User",
          profile: {
            firstName: "Demo",
            lastName: "Pending",
            phone: "9000000001",
            city: "Bengaluru",
            state: "Karnataka",
            country: "India",
            postalCode: "560001",
          },
        },
        verifiedUser: {
          email: "demo.verified@swingpool.test",
          password: "DemoUser@12345",
          displayName: "Demo Verified User",
          profile: {
            firstName: "Demo",
            lastName: "Verified",
            phone: "9000000002",
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            postalCode: "400001",
          },
          subscription: {
            charityContributionInr: 17.9,
            paymentIntentId: "sample_pi_verified_user_monthly",
            paymentStatus: "succeeded",
            qualifyingNumbers: [3, 7, 12, 18, 25],
          },
        },
      },
      null,
      2,
    ),
  );

  return sourcePath;
};

describe("User Seeders", () => {
  afterEach(() => {
    unsetEnv(
      "ADMIN_BOOTSTRAP_EMAIL",
      "ADMIN_BOOTSTRAP_PASSWORD",
      "SAMPLE_SEED_ENABLED",
      "SAMPLE_SEED_SOURCE_PATH",
    );
  });

  it("creates the bootstrap admin when admin env vars are configured", async () => {
    process.env.ADMIN_BOOTSTRAP_EMAIL = "admin@swingpool.test";
    process.env.ADMIN_BOOTSTRAP_PASSWORD = "StrongPassword@12345";

    const logger = createLogger();
    const seeder = new AdminUserSeeder();

    vi.spyOn(UserModel, "findOne").mockResolvedValue(null);
    vi.spyOn(utils, "hashPassword").mockResolvedValue("hashed-admin-password");
    vi.spyOn(UserModel, "create").mockResolvedValue({
      id: "admin-user-id",
      email: "admin@swingpool.test",
    });
    vi.spyOn(UserProfileModel, "create").mockResolvedValue({
      id: "admin-profile-id",
    });

    await seeder.run({ logger });

    expect(UserModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "admin@swingpool.test",
        mustRotatePassword: true,
      }),
    );
    expect(UserProfileModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-user-id",
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "admin@swingpool.test",
        mustRotatePassword: true,
      }),
      expect.stringContaining("Admin seed created successfully"),
    );
  });

  it("creates the documented demo users when sample seed is enabled", async () => {
    process.env.SAMPLE_SEED_ENABLED = "true";
    process.env.SAMPLE_SEED_SOURCE_PATH = writeSampleSeedSource();

    const logger = createLogger();
    const seeder = new SampleDataSeeder();
    const charityQuery = {
      sort: vi.fn().mockResolvedValue({
        id: "charity-id",
      }),
    };

    vi.spyOn(utils, "hashPassword").mockResolvedValue("hashed-demo-password");
    vi.spyOn(SubscriptionPlanModel, "findOneAndUpdate").mockResolvedValue({
      id: "plan-id",
      code: "monthly",
      name: "Monthly",
      priceInr: 179,
      billingCycleDays: 30,
    });
    vi.spyOn(CharityModel, "findOne").mockReturnValue(charityQuery);
    vi.spyOn(UserModel, "findOne").mockResolvedValue(null);
    vi.spyOn(UserModel, "create")
      .mockResolvedValueOnce({
        id: "pending-user-id",
        email: "demo.pending@swingpool.test",
      })
      .mockResolvedValueOnce({
        id: "verified-user-id",
        email: "demo.verified@swingpool.test",
      });
    vi.spyOn(UserProfileModel, "findOneAndUpdate").mockResolvedValue({});
    vi.spyOn(CharitySelectionModel, "findOneAndUpdate").mockResolvedValue({});
    vi.spyOn(SubscriptionModel, "findOne").mockResolvedValue(null);
    vi.spyOn(SubscriptionModel, "create").mockResolvedValue({});
    vi.spyOn(ScoreModel, "findOne").mockResolvedValue(null);
    vi.spyOn(ScoreModel, "create").mockResolvedValue({});

    await seeder.run({ logger });

    expect(utils.hashPassword).toHaveBeenCalledWith("DemoUser@12345");
    expect(UserModel.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        email: "demo.pending@swingpool.test",
      }),
    );
    expect(UserModel.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        email: "demo.verified@swingpool.test",
      }),
    );
    expect(SubscriptionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "verified-user-id",
        status: "active",
      }),
    );
    expect(ScoreModel.create).toHaveBeenCalledTimes(5);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        seededUsers: [
          "demo.pending@swingpool.test",
          "demo.verified@swingpool.test",
        ],
        sourcePath: process.env.SAMPLE_SEED_SOURCE_PATH,
      }),
      expect.stringContaining("Sample demo data seeded successfully"),
    );
  });
});
