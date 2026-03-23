import { fetchBaserow, BASEROW_TABLES } from "../baserow/client.js";

export async function logAuditEntry(tenantId: string | number, input: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  await fetchBaserow(
    `/api/database/rows/table/${BASEROW_TABLES.AUDIT_LOGS}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        tenantId: String(tenantId),
        userId: input.userId || "system",
        action: input.action,
        resource_type: input.resourceType,
        resource_id: input.resourceId || "",
        details_json: JSON.stringify(input.details || {}),
        ip_address: input.ipAddress || "",
        user_agent: input.userAgent || "",
        created_at: new Date().toISOString(),
      }),
    }
  );
}

export async function logAdminAction(tenantId: string | number, userId: string, action: string, resourceType: string, resourceId: string) {
    return logAuditEntry(tenantId, {
        userId,
        action,
        resourceType,
        resourceId,
    });
}
