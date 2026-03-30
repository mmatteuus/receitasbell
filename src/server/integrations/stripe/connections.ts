// src/server/integrations/stripe/connections.ts
import { logAuditEvent } from "../../audit/repo.js";
import { decryptSecret, encryptSecret } from "../../shared/crypto.js";
import { ApiError } from "../../shared/http.js";
import { BaserowError, fetchBaserow, BASEROW_TABLES } from "../baserow/client.js";
import { getTenantById } from "../../tenancy/repo.js";

type ConnectionStatus = "connected" | "disconnected" | "reconnect_required";

export type TenantStripeConnection = {
  id: string;
  tenantId: string;
  stripeAccountId: string;
  accessTokenEncrypted: string;
  scope: string | null;
  status: ConnectionStatus;
  connectedAt: string | null;
  disconnectedAt: string | null;
  lastError: string | null;
  createdByUserId: string | null;
  updatedAt: string | null;
};

type StripeConnectionRow = {
  id?: string | number;
  tenant_id?: string | number;
  stripe_account_id?: string;
  access_token_encrypted?: string;
  scope?: string;
  status?: string;
  connected_at?: string;
  disconnected_at?: string;
  last_error?: string;
  created_by_user_id?: string | number;
  updated_at?: string;
  created_at?: string;
};

function normalizeStatus(value: unknown): ConnectionStatus {
  if (value === "connected") return "connected";
  if (value === "reconnect_required") return "reconnect_required";
  return "disconnected";
}

function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function mapRow(row: StripeConnectionRow): TenantStripeConnection {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id ?? ""),
    stripeAccountId: String(row.stripe_account_id ?? ""),
    accessTokenEncrypted: String(row.access_token_encrypted ?? ""),
    scope: row.scope ? String(row.scope) : null,
    status: normalizeStatus(row.status),
    connectedAt: toIsoOrNull(row.connected_at ?? row.created_at),
    disconnectedAt: toIsoOrNull(row.disconnected_at),
    lastError: row.last_error ? String(row.last_error) : null,
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : null,
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

function requireTableId() {
  const tableId = BASEROW_TABLES.STRIPE_CONNECTIONS;
  if (!tableId) throw new ApiError(500, "BASEROW_TABLE_STRIPE_CONNECTIONS nao configurada.");
  return tableId;
}

function isMissingTableError(error: unknown) {
  if (!(error instanceof BaserowError) || error.status !== 404) return false;
  const body = error.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  return (body as { error?: unknown }).error === "ERROR_TABLE_DOES_NOT_EXIST";
}

async function queryConnections(tenantId: string): Promise<StripeConnectionRow[]> {
  const tableId = requireTableId();
  const tenantRecord = await getTenantById(tenantId).catch(() => null);
  const keys = new Set([String(tenantId)]);
  if ((tenantRecord as { slug?: string } | null)?.slug) keys.add((tenantRecord as { slug: string }).slug);

  const rowsById = new Map<string, StripeConnectionRow>();
  try {
    for (const key of keys) {
      const data = await fetchBaserow<{ results: StripeConnectionRow[] }>(
        `/api/database/rows/table/${tableId}/?user_field_names=true&filter__tenant_id__equal=${encodeURIComponent(key)}&order_by=-id`,
      );
      for (const row of data.results) {
        if (row.id != null) rowsById.set(String(row.id), row);
      }
    }
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
  return Array.from(rowsById.values()).sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
}

function getActiveRow(rows: StripeConnectionRow[]): StripeConnectionRow | null {
  return (
    rows.find((r) => normalizeStatus(r.status) === "connected") ??
    rows.find((r) => normalizeStatus(r.status) === "reconnect_required") ??
    null
  );
}

async function markExistingAsDisconnected(tenantId: string): Promise<string[]> {
  const tableId = requireTableId();
  const rows = await queryConnections(tenantId);
  const active = rows.filter((r) => { const s = normalizeStatus(r.status); return s === "connected" || s === "reconnect_required"; });
  if (!active.length) return [];
  const now = new Date().toISOString();
  await Promise.all(
    active.map((r) => fetchBaserow(`/api/database/rows/table/${tableId}/${r.id}/?user_field_names=true`, {
      method: "PATCH",
      body: JSON.stringify({ status: "disconnected", disconnected_at: now, updated_at: now }),
    })),
  );
  return active.map((r) => String(r.id));
}

export async function getTenantStripeConnection(tenantId: string): Promise<TenantStripeConnection | null> {
  const rows = await queryConnections(tenantId);
  const active = getActiveRow(rows);
  if (active) return mapRow(active);
  const latest = rows[0];
  return latest ? mapRow(latest) : null;
}

export async function requireTenantStripeConnection(tenantId: string) {
  const c = await getTenantStripeConnection(tenantId);
  if (!c) throw new ApiError(409, "Conecte uma conta Stripe antes de ativar pagamentos.");
  return c;
}

export function readStripeConnectionSecrets(connection: TenantStripeConnection) {
  return { accessToken: decryptSecret(connection.accessTokenEncrypted) };
}

export async function upsertTenantStripeConnection(input: {
  tenantId: string;
  stripeAccountId: string;
  accessToken: string;
  scope?: string | null;
  actorUserId?: string | null;
}): Promise<TenantStripeConnection> {
  const tableId = requireTableId();
  const existing = await queryConnections(input.tenantId);
  const hadActive = Boolean(getActiveRow(existing));
  const replacedIds = await markExistingAsDisconnected(input.tenantId);
  const now = new Date().toISOString();
  const created = await fetchBaserow<StripeConnectionRow>(
    `/api/database/rows/table/${tableId}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        tenant_id: String(input.tenantId),
        stripe_account_id: input.stripeAccountId,
        access_token_encrypted: encryptSecret(input.accessToken),
        scope: input.scope || "",
        status: "connected",
        connected_at: now,
        last_error: "",
        created_by_user_id: input.actorUserId ? String(input.actorUserId) : "",
        updated_at: now,
        created_at: now,
      }),
    },
  );
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: input.actorUserId ? "admin" : "system",
    actorId: String(input.actorUserId || "system"),
    action: hadActive ? "stripe.reconnect" : "stripe.connect",
    resourceType: "stripe_connection",
    resourceId: String(created.id),
    payload: { stripeAccountId: input.stripeAccountId, replacedIds },
  });
  return mapRow(created);
}

export async function disconnectTenantStripeConnection(input: {
  tenantId: string;
  actorUserId?: string | null;
}): Promise<boolean> {
  const tableId = requireTableId();
  const rows = await queryConnections(input.tenantId);
  const active = getActiveRow(rows);
  if (active) {
    const now = new Date().toISOString();
    await fetchBaserow(`/api/database/rows/table/${tableId}/${active.id}/?user_field_names=true`, {
      method: "PATCH",
      body: JSON.stringify({ status: "disconnected", disconnected_at: now, updated_at: now }),
    });
  }
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: input.actorUserId ? "admin" : "system",
    actorId: String(input.actorUserId || "system"),
    action: "stripe.disconnect",
    resourceType: "stripe_connection",
    resourceId: active ? String(active.id) : "none",
    payload: { hadActive: Boolean(active) },
  });
  return true;
}

export async function markStripeConnectionReconnectRequired(input: {
  tenantId: string;
  reason?: string | null;
}): Promise<boolean> {
  const tableId = requireTableId();
  const rows = await queryConnections(input.tenantId);
  const active = getActiveRow(rows);
  if (!active) return false;
  const now = new Date().toISOString();
  await fetchBaserow(`/api/database/rows/table/${tableId}/${active.id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({ status: "reconnect_required", last_error: input.reason || "connection_invalid", updated_at: now }),
  });
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: "system",
    actorId: "system",
    action: "stripe.connection_error",
    resourceType: "stripe_connection",
    resourceId: String(active.id),
    payload: { reason: input.reason || "connection_invalid" },
  });
  return true;
}

export async function getUsableStripeAccountId(tenantId: string): Promise<{
  connection: TenantStripeConnection;
  stripeAccountId: string;
  accessToken: string;
}> {
  const connection = await requireTenantStripeConnection(tenantId);
  if (connection.status === "disconnected") throw new ApiError(409, "A conta Stripe esta desconectada.");
  if (connection.status === "reconnect_required") throw new ApiError(409, "A conexao Stripe precisa ser refeita.");
  const { accessToken } = readStripeConnectionSecrets(connection);
  if (!accessToken) {
    await markStripeConnectionReconnectRequired({ tenantId, reason: "access_token_empty" });
    throw new ApiError(409, "A conexao Stripe esta invalida. Reconecte a conta.");
  }
  return { connection, stripeAccountId: connection.stripeAccountId, accessToken };
}
