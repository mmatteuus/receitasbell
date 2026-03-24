import { baserowFetch } from "../integrations/baserow/client.js";
import { baserowTables } from "../integrations/baserow/tables.js";

export async function auditLog(entry: {
  tenantId: string;
  actorType: "user" | "admin" | "system";
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload?: unknown;
}) {
  await baserowFetch(`/api/database/rows/table/${baserowTables.auditLogs}/?user_field_names=true`, {
    method: "POST",
    body: JSON.stringify({
      tenant_id: entry.tenantId,
      actor_type: entry.actorType,
      actor_id: entry.actorId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      payload_json: JSON.stringify(entry.payload ?? null),
      created_at: new Date().toISOString(),
    }),
  });
}
