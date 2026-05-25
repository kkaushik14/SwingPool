import { afterEach, describe, expect, it } from "vitest";

import {
  clearToasts,
  dismissToast,
  getToastSnapshot,
  pushToast
} from "@/store";

describe("toast store", () => {
  afterEach(() => {
    clearToasts();
  });

  it("adds and removes toast entries", () => {
    const toastId = pushToast({
      tone: "info",
      title: "Backend connected",
      description: "The shell can start loading protected views."
    });

    expect(getToastSnapshot()).toHaveLength(1);
    expect(getToastSnapshot()[0]?.id).toBe(toastId);

    dismissToast(toastId);
    expect(getToastSnapshot()).toHaveLength(0);
  });
});
