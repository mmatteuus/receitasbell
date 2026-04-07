import { supabaseAdmin } from "../integrations/supabase/client.js";

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
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      organization_id: input.organization_id,
      user_id: input.user_id,
      action: input.action,
      resource: input.resource,
      resource_id: input.resource_id,
      metadata: input.metadata || {},
      ip: input.ip,
      user_agent: input.user_agent,
    });

    if (error) {
      console.error("[AuditLog] Failed to create log:", error);
    }
  } catch (err) {
    console.error("[AuditLog] Critical error creating log:", err);
  }
}
