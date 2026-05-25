import { config } from "../../config/index.js";
import { USER_ROLES } from "../../enums/index.js";
import { logger } from "../../logger/index.js";
import { hashPassword } from "../../utils/index.js";
import { authRepository } from "../../components/auth/auth.repository.js";
import { UserModel } from "../../components/users/users.model.js";
import { connectDatabase, disconnectDatabase } from "../mongoose.js";

const run = async () => {
  if (config.isProduction) {
    throw new Error(
      "Admin password rotation script is disabled in production. Use your production secret tooling.",
    );
  }

  const email = process.env.ADMIN_ROTATE_EMAIL?.trim().toLowerCase();
  const newPassword = process.env.ADMIN_ROTATE_PASSWORD;

  if (!email || !newPassword) {
    throw new Error(
      "ADMIN_ROTATE_EMAIL and ADMIN_ROTATE_PASSWORD must be provided.",
    );
  }

  if (newPassword.length < 14) {
    throw new Error("ADMIN_ROTATE_PASSWORD must be at least 14 characters.");
  }

  const connected = await connectDatabase();

  if (!connected) {
    throw new Error("Database connection unavailable for credential rotation.");
  }

  try {
    const adminUser = await UserModel.findOne({
      email,
      role: USER_ROLES.ADMIN,
    });

    if (!adminUser) {
      throw new Error("Admin user not found for provided email.");
    }

    const passwordHash = await hashPassword(newPassword);

    await UserModel.findByIdAndUpdate(adminUser.id, {
      passwordHash,
      mustRotatePassword: false,
      passwordChangedAt: new Date(),
      lastLoginAt: null,
    });

    await authRepository.revokeAllUserSessions(adminUser.id);

    logger.info(
      {
        email,
        adminUserId: adminUser.id,
      },
      "Admin credentials rotated and active sessions revoked.",
    );
  } finally {
    await disconnectDatabase();
  }
};

run().catch((error) => {
  logger.error(
    { error: error.message, stack: error.stack },
    "Admin credential rotation failed",
  );
  process.exit(1);
});
