import { ApiError } from "../../shared/http.js";
import { fetchBaserow } from "../../integrations/baserow/client.js";
import { baserowTables } from "../../integrations/baserow/tables.js";
import { SocialAuthStatus, SocialIdentityRow, SocialOAuthStateRow, SaveSocialIdentityInput } from "./types.js";

type BaserowStateRow = Record<string, unknown>; // allow snake_case and camelCase from Baserow

function isBadRequestError(error: unknown) {
  return error instanceof ApiError && error.status === 400;
}

function normalizeStateRow(row: BaserowStateRow | undefined): SocialOAuthStateRow | null {
  if (!row || row.id == null) return null;
  const r = row as Record<string, unknown>;
  return {
    id: Number(r.id),
    provider: (r.provider ?? "google") as SocialOAuthStateRow["provider"],
    tenantId: String(r.tenantId ?? r.tenant_id ?? ""),
    stateHash: String(r.stateHash ?? r.state_hash ?? ""),
    redirectTo: (r.redirectTo ?? r.redirect_to ?? null) as string | null,
    expiresAt: (r.expiresAt ?? r.expires_at ?? null) as string | null,
    consumedAt: (r.consumedAt ?? r.consumed_at ?? null) as string | null,
    ip: (r.ip ?? null) as string | null,
    userAgent: (r.userAgent ?? r.user_agent ?? null) as string | null,
    status: ((r.status as SocialAuthStatus) ?? "active") as SocialAuthStatus,
    createdAt: (r.createdAt ?? r.created_at ?? null) as string | null,
  };
}


function normalizeIdentityRow(row: Record<string, unknown>): SocialIdentityRow {
  return {
    id: Number(row.id ?? 0),
    provider: (row.provider as SocialIdentityRow["provider"]) ?? "google",
    tenantId: String(row.tenantId ?? row.tenant_id ?? ""),
    providerSubject: String(row.providerSubject ?? row.provider_subject ?? ""),
    email: String(row.email ?? ""),
    emailVerified: Boolean(row.emailVerified ?? row.email_verified),
    pictureUrl: (row.pictureUrl ?? row.picture_url ?? null) as string | null,
    linkedAt: (row.linkedAt ?? row.linked_at ?? null) as string | null,
    lastLoginAt: (row.lastLoginAt ?? row.last_login_at ?? null) as string | null,
    status: ((row.status as SocialIdentityRow["status"]) ?? "active") as SocialIdentityRow["status"],
    createdAt: (row.createdAt ?? row.created_at ?? null) as string | null,
    updatedAt: (row.updatedAt ?? row.updated_at ?? null) as string | null,
  };
}


async function postWithFallback(tableId: number, payload: Record<string, unknown>) {
  if (!tableId) throw new ApiError(500, "Social table not configured");
  const basePath = `/api/database/rows/table/${tableId}/?user_field_names=true`;
  try {
    return await fetchBaserow(basePath, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (!isBadRequestError(error)) throw error;
    const snake = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`), value]),
    );
    return await fetchBaserow(basePath, {
      method: "POST",
      body: JSON.stringify(snake),
    });
  }
}

export async function saveAuthOAuthState(input: {
  provider: SocialOAuthStateRow["provider"];
  tenantId: string;
  stateHash: string;
  redirectTo: string;
  expiresAt: string;
  ip?: string;
  userAgent?: string;
}) {
  const tableId = baserowTables.oauthStates;
  if (!tableId) throw new ApiError(500, "OAuth states table not configured");
  await postWithFallback(tableId, {
    provider: input.provider,
    tenantId: input.tenantId,
    stateHash: input.stateHash,
    redirectTo: input.redirectTo,
    expiresAt: input.expiresAt,
    status: "active",
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  });
}

async function fetchStateByHash(stateHash: string, provider: SocialOAuthStateRow["provider"], tenantId: string) {
  const tableId = baserowTables.oauthStates;
  if (!tableId) return null;
  const filters = [
    `filter__state_hash__equal=${encodeURIComponent(stateHash)}`,
    `filter__provider__equal=${encodeURIComponent(provider)}`,
    `filter__tenant_id__equal=${encodeURIComponent(tenantId)}`,
    `filter__status__equal=active`,
  ].join("&");

  const data = await fetchBaserow<{ results: BaserowStateRow[] }>(
    `/api/database/rows/table/${tableId}/?user_field_names=true&${filters}`,
  );
  if (data.results.length) return normalizeStateRow(data.results[0]);
  return null;
}

export async function consumeAuthOAuthState(options: { stateHash: string; provider: SocialOAuthStateRow["provider"]; tenantId: string }) {
  const row = await fetchStateByHash(options.stateHash, options.provider, options.tenantId);
  if (!row) {
    throw new ApiError(400, "Estado OAuth inválido ou já consumido.");
  }
  if (row.status !== "active") {
    throw new ApiError(400, "Estado OAuth já utilizado.");
  }
  if (!row.expiresAt || new Date(row.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(410, "Estado OAuth expirado.");
  }

  await fetchBaserow(`/api/database/rows/table/${baserowTables.oauthStates}/${row.id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({ status: "consumed", consumedAt: new Date().toISOString() }),
  });

  return row;
}

export async function findSocialIdentity(tenantId: string, provider: SocialIdentityRow["provider"], providerSubject: string) {
  const tableId = baserowTables.oauthStates;
  if (!tableId) return null;
  const filters = [
    `filter__tenant_id__equal=${encodeURIComponent(tenantId)}`,
    `filter__provider__equal=${encodeURIComponent(provider)}`,
    `filter__provider_subject__equal=${encodeURIComponent(providerSubject)}`,
  ].join("&");
  const data = await fetchBaserow<{ results: Record<string, unknown>[] }>(
    `/api/database/rows/table/${tableId}/?user_field_names=true&${filters}`,
  );
  if (!data.results.length) return null;
  return normalizeIdentityRow(data.results[0]);
}

export async function createSocialIdentity(input: SaveSocialIdentityInput) {
  const now = new Date().toISOString();
  const oauthTable = baserowTables.oauthStates;
  if (!oauthTable) return;
  await postWithFallback(oauthTable, {
    tenantId: input.tenantId,
    provider: input.provider,
    providerSubject: input.providerSubject,
    email: input.email.toLowerCase(),
    emailVerified: input.emailVerified,
    pictureUrl: input.pictureUrl ?? null,
    linkedAt: now,
    lastLoginAt: now,
    status: "active",
  });
}

export async function updateSocialIdentityLastLogin(rowId: number) {
  const tableId = baserowTables.oauthStates;
  if (!tableId) return;
  await fetchBaserow(`/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({ lastLoginAt: new Date().toISOString() }),
  });
}
