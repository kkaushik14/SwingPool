import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_SAMPLE_SEED_SOURCE_PATH = ".local/sample-seed.json";

const validateUserSeed = (value, label) => {
  if (!value || typeof value !== "object") {
    throw new Error(`${label} is missing from the sample seed source.`);
  }

  if (!value.email || !value.password || !value.displayName || !value.profile) {
    throw new Error(
      `${label} must include email, password, displayName, and profile fields.`,
    );
  }
};

export const resolveSampleSeedSourcePath = () =>
  path.resolve(
    process.cwd(),
    process.env.SAMPLE_SEED_SOURCE_PATH?.trim() || DEFAULT_SAMPLE_SEED_SOURCE_PATH,
  );

export const loadSampleSeedSource = async ({ logger }) => {
  const sourcePath = resolveSampleSeedSourcePath();

  try {
    const raw = await fs.readFile(sourcePath, "utf8");
    const parsed = JSON.parse(raw);

    validateUserSeed(parsed.pendingUser, "pendingUser");
    validateUserSeed(parsed.verifiedUser, "verifiedUser");

    return {
      sourcePath,
      data: parsed,
    };
  } catch (error) {
    logger.warn(
      {
        sourcePath,
        error: error.message,
      },
      "Skipping sample data seed because the local sample seed source could not be loaded.",
    );

    return null;
  }
};
