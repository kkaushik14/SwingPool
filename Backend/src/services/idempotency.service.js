import { createHash } from "node:crypto";

import { config } from "../config/index.js";

const stores = new Map();

const now = () => Date.now();

const buildStoreKey = ({ scope, key }) => `${scope}:${key}`;

const buildRequestHash = (payload) => {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
};

const getTtlMilliseconds = () => config.security.idempotency.ttlSeconds * 1000;

const pruneExpiredEntries = () => {
  const timestamp = now();

  for (const [entryKey, entry] of stores.entries()) {
    if (entry.expiresAt <= timestamp) {
      stores.delete(entryKey);
    }
  }
};

export const idempotencyService = {
  buildRequestHash,

  reserve({ scope, key, requestHash }) {
    pruneExpiredEntries();
    const entryKey = buildStoreKey({ scope, key });
    const existing = stores.get(entryKey);

    if (existing) {
      return {
        created: false,
        entry: existing,
      };
    }

    const entry = {
      key,
      scope,
      requestHash,
      status: "in_progress",
      response: null,
      createdAt: now(),
      expiresAt: now() + getTtlMilliseconds(),
    };

    stores.set(entryKey, entry);

    return {
      created: true,
      entry,
    };
  },

  get({ scope, key }) {
    pruneExpiredEntries();
    return stores.get(buildStoreKey({ scope, key })) || null;
  },

  complete({ scope, key, response }) {
    const entryKey = buildStoreKey({ scope, key });
    const existing = stores.get(entryKey);

    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      status: "completed",
      response,
      expiresAt: now() + getTtlMilliseconds(),
    };

    stores.set(entryKey, updated);
    return updated;
  },

  clear({ scope, key }) {
    stores.delete(buildStoreKey({ scope, key }));
  },

  clearAll() {
    stores.clear();
  },
};
