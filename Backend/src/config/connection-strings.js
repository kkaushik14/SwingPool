import { config } from "./app.config.js";

export const connectionStrings = Object.freeze({
  mongo: config.database.uri,
});
