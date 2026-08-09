import { logAuditEvent } from './repo.js';

type AuditLogInput = {
  organization_id: string;
  user_id: string;
  action: string;
  resource?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  user_agent?: string;
};

export async function createAuditLog(input: AuditLogInput) {
  await logAuditEvent({
    actorType: 'admin',
    actorId: input.user_id,
    tenantId: input.organization_id,
    action: input.action,
    resourceType: input.resource,
    resourceId: input.resource_id,
    payload: input.metadata,
    ip: input.ip,
    userAgent: input.user_agent,
  });
}
