import { fetchBaserow, BASEROW_TABLES } from "../../integrations/baserow/client.js";
import { logger } from "./logger.js";

export type AuditEvent = {
  actorType: "user" | "admin" | "system";
  actorId: string | number;
  tenantId?: string | number;
  action: string;
  resourceType?: string;
  resourceId?: string | number;
  payload?: any;
};

export async function logAuditEvent(event: AuditEvent) {
  try {
    const now = new Date().toISOString();
    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.AUDIT_LOGS}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({
        actor_type: event.actorType,
        actor_id: String(event.actorId),
        tenant_id: event.tenantId ? String(event.tenantId) : "",
        action: event.action,
        resource_type: event.resourceType || "",
        resource_id: event.resourceId ? String(event.resourceId) : "",
        payload: JSON.stringify(event.payload || {}),
        created_at: now,
      }),
    });
  } catch (err) {
    // We don't want audit failures to break the main flow, but we MUST log them
    logger.error("Failed to persist audit log", err);
  }
}
