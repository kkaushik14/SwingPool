import { randomBytes } from "node:crypto";

import {
  PROFILE_COMPLETION_STATUSES,
  PROFILE_VERIFICATION_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from "../../../enums/index.js";
import { hashPassword } from "../../../utils/index.js";
import { UserProfileModel } from "../../../components/users/users-profile.model.js";
import { UserModel } from "../../../components/users/users.model.js";

import { BaseSeeder } from "../base-seeder.js";

const buildBootstrapPassword = () => {
  const configured = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (configured) {
    return {
      password: configured,
      generated: false,
    };
  }

  return {
    password: randomBytes(24).toString("base64url"),
    generated: true,
  };
};

export class AdminUserSeeder extends BaseSeeder {
  constructor() {
    super("admin-user-seeder");
  }

  async run({ logger }) {
    const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();

    if (!adminEmail) {
      logger.warn(
        "Skipping admin bootstrap seed because ADMIN_BOOTSTRAP_EMAIL is not configured.",
      );
      return;
    }

    const existing = await UserModel.findOne({ email: adminEmail });

    if (existing) {
      logger.info({ email: adminEmail }, "Admin seed already exists.");
      return;
    }

    const { password, generated } = buildBootstrapPassword();

    if (password.length < 14) {
      throw new Error(
        "ADMIN_BOOTSTRAP_PASSWORD must be at least 14 characters.",
      );
    }

    const passwordHash = await hashPassword(password);

    const createdAdmin = await UserModel.create({
      email: adminEmail,
      passwordHash,
      displayName: "Swing Pool Admin",
      role: USER_ROLES.ADMIN,
      status: USER_STATUSES.VERIFIED,
      emailVerifiedAt: new Date(),
      mustRotatePassword: true,
    });

    await UserProfileModel.create({
      userId: createdAdmin.id,
      firstName: "Swing",
      lastName: "Admin",
      phone: "0000000000",
      dateOfBirth: new Date("1990-01-01"),
      addressLine1: "Bootstrap Address",
      city: "Bootstrap City",
      state: "Bootstrap State",
      postalCode: "000000",
      country: "India",
      completionStatus: PROFILE_COMPLETION_STATUSES.COMPLETED,
      verificationStatus: PROFILE_VERIFICATION_STATUSES.VERIFIED,
      verifiedBy: createdAdmin.id,
      verifiedAt: new Date(),
      verificationReason: "Bootstrap admin profile",
    });

    logger.info(
      {
        email: adminEmail,
        mustRotatePassword: true,
      },
      "Admin seed created successfully. Rotate password after first login.",
    );

    if (generated) {
      logger.warn(
        {
          email: adminEmail,
          bootstrapPassword: password,
        },
        "Generated one-time ADMIN bootstrap password. Store it securely and rotate immediately.",
      );
    }
  }
}
