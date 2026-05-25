import { config } from "../config/index.js";
import { logger } from "../logger/index.js";

let isShuttingDown = false;

export const registerGracefulShutdown = (shutdownHandler) => {
  const shutdown = async (signal, exitCode = 0, error = null) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    if (error) {
      logger.error(
        { signal, error: error.message, stack: error.stack },
        "Received fatal process error",
      );
    } else {
      logger.info({ signal }, "Received shutdown signal");
    }

    const timeout = setTimeout(() => {
      logger.error({ signal }, "Graceful shutdown timed out. Forcing exit.");
      process.exit(1);
    }, config.server.shutdownTimeoutMs);

    timeout.unref();

    try {
      await shutdownHandler();
      clearTimeout(timeout);
      process.exit(exitCode);
    } catch (shutdownError) {
      clearTimeout(timeout);
      logger.error(
        { error: shutdownError.message, stack: shutdownError.stack },
        "Shutdown failed",
      );
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT", 0));
  process.on("SIGTERM", () => shutdown("SIGTERM", 0));

  process.on("unhandledRejection", (error) => {
    shutdown(
      "unhandledRejection",
      1,
      error instanceof Error ? error : new Error(String(error)),
    );
  });

  process.on("uncaughtException", (error) => {
    shutdown("uncaughtException", 1, error);
  });
};
