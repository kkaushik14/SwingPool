import { createServer } from "node:http";

import { createApp } from "../app/index.js";
import { config } from "../config/index.js";
import { connectDatabase, disconnectDatabase } from "../database/index.js";
import { startJobScheduler, stopJobScheduler } from "../jobs/index.js";
import { logger } from "../logger/index.js";

import { registerGracefulShutdown } from "./graceful-shutdown.js";

let server;

export const startServer = async () => {
  const databaseConnected = await connectDatabase();

  const app = createApp();
  server = createServer(app);

  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(config.server.port, config.server.host);
  });

  logger.info(
    {
      host: config.server.host,
      port: config.server.port,
      apiBasePath: `${config.server.apiPrefix}/${config.server.apiVersion}`,
      docsPath: "/api-docs",
    },
    "HTTP server started",
  );

  startJobScheduler({
    databaseConnected,
  });

  return server;
};

export const stopServer = async () => {
  stopJobScheduler();

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    server = null;
  }

  await disconnectDatabase();
  logger.info("HTTP server stopped");
};

if (!config.isTest) {
  startServer().catch((error) => {
    logger.error(
      { error: error.message, stack: error.stack },
      "Failed to start backend server",
    );
    process.exit(1);
  });

  registerGracefulShutdown(stopServer);
}
