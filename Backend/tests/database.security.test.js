import { describe, expect, it } from "vitest";

import { redactMongoUri } from "../src/database/mongoose.js";

describe("Database Security Helpers", () => {
  it("redacts credentials in mongo connection URIs for logging", () => {
    const redacted = redactMongoUri(
      "mongodb://dbUser:dbPassword@localhost:27017/swing-pool",
    );

    expect(redacted).not.toContain("dbUser");
    expect(redacted).not.toContain("dbPassword");
    expect(redacted).toContain("***");
  });

  it("handles malformed URIs without leaking credentials", () => {
    const redacted = redactMongoUri(
      "mongodb://rawUser:rawPass@localhost/swing-pool?replicaSet=rs0",
    );

    expect(redacted).not.toContain("rawUser");
    expect(redacted).not.toContain("rawPass");
  });
});
