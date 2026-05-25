import { AuditEventModel } from "./audit.model.js";

export const auditRepository = {
  async create(payload) {
    return AuditEventModel.create(payload);
  },

  async list(filter = {}, limit = 100) {
    return AuditEventModel.find(filter).sort({ createdAt: -1 }).limit(limit);
  },
};
