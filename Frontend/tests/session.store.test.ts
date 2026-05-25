import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearSession,
  readSession,
  subscribeSession,
  writeSession
} from "@/store";

describe("session store", () => {
  afterEach(() => {
    clearSession();
  });

  it("writes and reads persisted session data", () => {
    writeSession({
      accessToken: "access-token",
      refreshToken: "refresh-token"
    });

    expect(readSession()).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token"
    });
  });

  it("notifies subscribers on write and clear", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSession(listener);

    writeSession({
      accessToken: "access-token",
      refreshToken: "refresh-token"
    });
    clearSession();
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0][0]).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token"
    });
    expect(listener.mock.calls[1][0]).toBeNull();
  });
});
