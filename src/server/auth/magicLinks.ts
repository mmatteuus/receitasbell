import { createHash, randomBytes } from "node:crypto";
import { fetchBaserow } from "../integrations/baserow/client.js";
import { baserowTables } from "../integrations/baserow/tables.js";

export type MagicLinkPurpose = "user_login" | "admin_login";

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function base64Url(bytes: Buffer) {
  return bytes.toString("base64url");
}

export async function createMagicLink(input: {
  tenantId: string;
  email: string;
  purpose: MagicLinkPurpose;
  expiresInMinutes?: number;
  redirectTo?: string | null;
}) {
  const token = base64Url(randomBytes(32));
  const tokenHash = sha256Hex(token);
  const ttl = (input.expiresInMinutes ?? 15) * 60_000;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl);

  await fetchBaserow(`/api/database/rows/table/${baserowTables.magicLinks}/?user_field_names=true`, {
    method: "POST",
    body: JSON.stringify({
      tenantId: String(input.tenantId),
      email: input.email.toLowerCase(),
      purpose: input.purpose,
      tokenHash,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      usedAt: null,
      redirectTo: input.redirectTo || "",
    }),
  });

  return { token };
}

export async function consumeMagicLink(input: { tenantId: string; token: string; purpose: MagicLinkPurpose }) {
  const tokenHash = sha256Hex(input.token);

  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${baserowTables.magicLinks}/?user_field_names=true&filter__tenantId__equal=${encodeURIComponent(
      input.tenantId
    )}&filter__purpose__equal=${input.purpose}&filter__tokenHash__equal=${tokenHash}`
  );

  const row = data.results[0];
  if (!row) return null;

  if (row.usedAt && row.usedAt.trim() !== "") return null;
  if (new Date(row.expiresAt).getTime() <= Date.now()) return null;

  await fetchBaserow(`/api/database/rows/table/${baserowTables.magicLinks}/${row.id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({ usedAt: new Date().toISOString() }),
  });

  return {
    email: String(row.email),
    redirectTo: (row.redirectTo && String(row.redirectTo)) || null,
  };
}
