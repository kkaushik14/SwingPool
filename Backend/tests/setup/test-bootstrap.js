import { afterEach, beforeEach, vi } from "vitest";

import { auditComponentService } from "../../src/components/audit/index.js";
import { idempotencyService } from "../../src/services/index.js";

process.env.TZ = "Asia/Kolkata";

beforeEach(() => {
  vi.restoreAllMocks();
  idempotencyService.clearAll();
  vi.spyOn(auditComponentService, "recordEvent").mockResolvedValue(null);
});

afterEach(() => {
  idempotencyService.clearAll();
});
