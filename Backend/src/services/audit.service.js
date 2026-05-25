import { auditComponentService } from "../components/audit/index.js";
import { auditLogger, logger } from "../logger/index.js";

export const logAuditEvent = ({
  action,
  actorId,
  actorRole,
  entity,
  entityId,
  metadata = {},
  requestId,
}) => {
  const payload = {
    action,
    actorId: actorId || null,
    actorRole: actorRole || null,
    entity,
    entityId: entityId ? String(entityId) : null,
    metadata,
    requestId: requestId || null,
    at: new Date().toISOString(),
  };

  auditLogger.info(payload);

  void auditComponentService.recordEvent(payload).catch((error) => {
    logger.warn(
      {
        action,
        entity,
        requestId,
        error: error.message,
      },
      "Failed to persist audit event",
    );
  });
};
