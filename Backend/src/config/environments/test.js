export const testConfig = Object.freeze({
  server: {
    host: "127.0.0.1",
    port: 0,
    trustProxy: false,
    shutdownTimeoutMs: 1000,
  },
  database: {
    retryAttempts: 1,
    retryDelayMs: 100,
  },
  logging: {
    level: "silent",
    prettyPrint: false,
  },
  security: {
    rateLimit: {
      max: 10000,
    },
  },
  openapi: {
    enabled: false,
  },
  jobs: {
    enabled: false,
  },
  notifications: {
    emailProvider: "noop",
    smsProvider: "noop",
  },
});
