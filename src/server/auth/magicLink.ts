import { v4 as uuidv4 } from "uuid";
import { fetchBaserow, BASEROW_TABLES } from "../baserow/client.js";
import { getAppBaseUrl } from "../http.js";

export async function createMagicLinkToken(tenantId: string | number, email: string) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString(); // 15 minutos

  await fetchBaserow(
    `/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        tenantId: String(tenantId),
        provider: "magic-link",
        state: token,
        expires_at: expiresAt,
      }),
    }
  );

  return token;
}

export async function verifyMagicLinkToken(tenantId: string | number, token: string) {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__state__equal=${token}&filter__provider__equal=magic-link`
  );

  const record = data.results[0];
  if (!record) return null;

  const expiresAt = new Date(record.expires_at).getTime();
  if (Date.now() > expiresAt || record.used_at) {
    return null;
  }

  // Marcar como usado
  await fetchBaserow(
    `/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/${record.id}/?user_field_names=true`,
    {
      method: "PATCH",
      body: JSON.stringify({ used_at: new Date().toISOString() }),
    }
  );

  return record;
}
