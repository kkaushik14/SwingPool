import { auditRepository } from "./audit.repository.js";

export const auditComponentService = {
  async recordEvent(payload) {
    return auditRepository.create(payload);
  },
};
