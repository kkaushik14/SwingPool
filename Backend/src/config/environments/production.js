export const productionConfig = Object.freeze({
  server: {
    trustProxy: true,
  },
  logging: {
    prettyPrint: false,
  },
  security: {
    helmet: {
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: true,
    },
  },
});
