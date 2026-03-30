import { supabaseAdmin } from "../integrations/supabase/client.js";
import { Logger } from "../shared/logger.js";

const logger = new Logger({ domain: "audit" });

export type AuditEvent = {
  actorType: "user" | "admin" | "system";
  actorId: string | number;
  tenantId?: string | number;
  action: string;
  resourceType?: string;
  resourceId?: string | number;
  payload?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

export async function logAuditEvent(event: AuditEvent) {
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert({
        actor_type: event.actorType,
        actor_id: String(event.actorId),
        tenant_id: event.tenantId || null,
        action: event.action,
        resource_type: event.resourceType || "",
        resource_id: event.resourceId ? String(event.resourceId) : "",
        payload: event.payload || {},
        ip: event.ip || "",
        user_agent: event.userAgent || "",
    });

    if (error) throw error;
  } catch (err) {
    // We don't want audit failures to break the main flow, but we MUST log them
    logger.error("Failed to persist audit log into Supabase", err);
  }
}
