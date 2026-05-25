import { config } from "../../config/index.js";
import { logger } from "../../logger/index.js";
import { connectDatabase, disconnectDatabase } from "../mongoose.js";

import { seedRegistry } from "./seed-registry.js";

const parseSeedFilter = () => {
  const raw = process.env.SEEDS;

  if (!raw) {
    return null;
  }

  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
};

export const runSeeds = async () => {
  if (config.isProduction) {
    throw new Error("Seed runner is disabled in production.");
  }

  const selectedSeeds = parseSeedFilter();

  const connected = await connectDatabase();

  if (!connected) {
    logger.warn(
      "Skipping seed execution because database connection is unavailable.",
    );
    return;
  }

  try {
    for (const seeder of seedRegistry) {
      if (selectedSeeds && !selectedSeeds.has(seeder.name)) {
        continue;
      }

      logger.info({ seeder: seeder.name }, "Running seed");
      await seeder.run({ logger });
      logger.info({ seeder: seeder.name }, "Seed completed");
    }

    logger.info("All seeds completed successfully");
  } finally {
    await disconnectDatabase();
  }
};
