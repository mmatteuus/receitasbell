import { fetchBaserow, BASEROW_TABLES } from "../../integrations/baserow/client.js";

export async function subscribeToNewsletter(tenantId: string | number, email: string): Promise<void> {
    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.NEWSLETTER}/?user_field_names=true`, {
        method: "POST",
        body: JSON.stringify({ email, tenantId: String(tenantId), created_at: new Date().toISOString() })
    });
}
