import { logger } from "../../logger/index.js";

import { runSeeds } from "./seed-runner.js";

runSeeds().catch((error) => {
  logger.error(
    { error: error.message, stack: error.stack },
    "Seed runner failed",
  );
  process.exit(1);
});
