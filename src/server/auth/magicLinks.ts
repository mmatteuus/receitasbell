import { baserowFetch } from "../integrations/baserow/client.js";
import { baserowTables } from "../integrations/baserow/tables.js";
import { sha256Hex } from "../shared/crypto.js";
import crypto from "node:crypto";

type MagicLinkRow = {
  id?: string | number;
  email?: string;
  redirectTo?: string | null;
  consumedAt?: string | null;
  expiresAt?: string | null;
  token?: string;
  tenantId?: string;
  purpose?: string;
};

export async function createMagicLink(input: { tenantId: string; email: string; purpose: "user"; redirectTo?: string }) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(token);
  const exp = new Date(Date.now() + 15 * 60_000);

  await baserowFetch(`/api/database/rows/table/${baserowTables.magicLinks}/?user_field_names=true`, {
    method: "POST",
    body: JSON.stringify({
      tenantId: input.tenantId,
      email: input.email.toLowerCase(),
      purpose: input.purpose,
      token: tokenHash,
      expiresAt: exp.toISOString().split("T")[0],
      consumedAt: null,
      redirectTo: input.redirectTo || null,
    }),
  });

  return { token };
}

export async function consumeMagicLink(input: { tenantId: string; token: string; purpose: "user" }) {
  const tokenHash = sha256Hex(input.token);
  const rows = await baserowFetch<{ results: MagicLinkRow[] }>(
    `/api/database/rows/table/${baserowTables.magicLinks}/?user_field_names=true&filter__tenantId__equal=${encodeURIComponent(
      input.tenantId
    )}&filter__purpose__equal=${input.purpose}&filter__token__equal=${tokenHash}`
  );

  const row = rows.results[0];
  if (!row) return null;
  if (row.consumedAt) return null;
  if (!row.expiresAt || new Date(row.expiresAt + "T23:59:59Z").getTime() <= Date.now()) return null;

  await baserowFetch(`/api/database/rows/table/${baserowTables.magicLinks}/${row.id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({ consumedAt: new Date().toISOString() }),
  });

  return { email: String(row.email), redirectTo: row.redirectTo ? String(row.redirectTo) : null };
}
