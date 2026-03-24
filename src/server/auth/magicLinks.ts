import crypto from "node:crypto";
import { baserowFetch } from "../integrations/baserow/client.js";
import { baserowTables } from "../integrations/baserow/tables.js";

function sha256Hex(v: string) {
  return crypto.createHash("sha256").update(v).digest("hex");
}

export async function createMagicLink(input: { tenantId: string; email: string; purpose: "user"; redirectTo?: string }) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(token);
  const now = new Date();
  const exp = new Date(now.getTime() + 15 * 60_000);

  await baserowFetch(`/api/database/rows/table/${baserowTables.magicLinks}/?user_field_names=true`, {
    method: "POST",
    body: JSON.stringify({
      tenant_id: input.tenantId,
      email: input.email.toLowerCase(),
      purpose: input.purpose,
      token_hash: tokenHash,
      created_at: now.toISOString(),
      expires_at: exp.toISOString(),
      used_at: "",
      redirect_to: input.redirectTo || "",
    }),
  });

  return { token };
}

export async function consumeMagicLink(input: { tenantId: string; token: string; purpose: "user" }) {
  const tokenHash = sha256Hex(input.token);
  const rows = await baserowFetch<{ results: any[] }>(
    `/api/database/rows/table/${baserowTables.magicLinks}/?user_field_names=true&filter__tenant_id__equal=${encodeURIComponent(
      input.tenantId
    )}&filter__purpose__equal=${input.purpose}&filter__token_hash__equal=${tokenHash}`
  );

  const row = rows.results[0];
  if (!row) return null;
  if (row.used_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;

  await baserowFetch(`/api/database/rows/table/${baserowTables.magicLinks}/${row.id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({ used_at: new Date().toISOString() }),
  });

  return { email: String(row.email), redirectTo: row.redirect_to ? String(row.redirect_to) : null };
}
