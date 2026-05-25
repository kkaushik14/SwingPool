export const developmentConfig = Object.freeze({
  server: {
    trustProxy: false,
  },
  logging: {
    level: "debug",
    prettyPrint: false,
  },
  security: {
    helmet: {
      contentSecurityPolicy: false,
    },
  },
});
