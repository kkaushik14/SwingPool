import { STORAGE_KEYS } from "@/constants";
import type { AuthTokenPair, StoredSession } from "@/types";

type SessionListener = (session: StoredSession | null) => void;

const listeners = new Set<SessionListener>();

const emitSession = (session: StoredSession | null) => {
  listeners.forEach((listener) => listener(session));
};

export const readSession = (): StoredSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.session);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch (_error) {
    window.localStorage.removeItem(STORAGE_KEYS.session);
    return null;
  }
};

export const writeSession = (tokens: AuthTokenPair | StoredSession) => {
  if (typeof window === "undefined") {
    return;
  }

  const nextSession: StoredSession = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    persistedAt: new Date().toISOString()
  };

  window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(nextSession));
  emitSession(nextSession);
};

export const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.session);
  emitSession(null);
};

export const subscribeSession = (listener: SessionListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
