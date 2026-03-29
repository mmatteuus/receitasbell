import { logAuditEvent } from "../../audit/repo.js";
import { decryptSecret, encryptSecret } from "../../shared/crypto.js";
import { getMercadoPagoAppEnvAsync } from "../../shared/env.js";
import { ApiError } from "../../shared/http.js";
import { BaserowError, fetchBaserow, BASEROW_TABLES } from "../baserow/client.js";
import { getSettingsMap, updateSettings as saveSettings } from "../../settings/repo.js";
import { getTenantById } from "../../tenancy/repo.js";

export { getMercadoPagoAppEnvAsync };

type OAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  user_id?: number | string;
  public_key?: string;
};

type ConnectionStatus = "connected" | "disconnected" | "reconnect_required";
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

export type TenantMercadoPagoConnection = {
  id: string;
  tenantId: string;
  mercadoPagoUserId: string | null;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  publicKey: string | null;
  status: ConnectionStatus;
  connectedAt: string | null;
  expiresAt: string | null;
  disconnectedAt: string | null;
  lastRefreshAt: string | null;
  lastError: string | null;
  createdByUserId: string | null;
  updatedAt: string | null;
};

type MercadoPagoConnectionRow = {
  id?: string | number;
  tenant_id?: string | number;
  tenantId?: string | number;
  mercado_pago_user_id?: string | number;
  access_token_encrypted?: string;
  access_token?: string;
  refresh_token_encrypted?: string;
  refresh_token?: string | boolean;
  public_key?: string;
  status?: string;
  connected_at?: string;
  expires_at?: string;
  disconnected_at?: string;
  last_refresh_at?: string;
  last_error?: string;
  created_by_user_id?: string | number;
  updated_at?: string;
  created_at?: string;
  user_id?: string | number;
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

function toExpiresAt(expiresIn?: number | null): string | null {
  if (!Number.isFinite(expiresIn) || Number(expiresIn) <= 0) return null;
  return new Date(Date.now() + Number(expiresIn) * 1000).toISOString();
}

function isExpiringSoon(expiresAt: string | null, thresholdMs = REFRESH_BEFORE_EXPIRY_MS) {
  if (!expiresAt) return false;
  const expiresAtMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs)) return false;
  return expiresAtMs <= Date.now() + thresholdMs;
}

function isEncryptedFormat(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function safeReadToken(value: string | null | undefined): string {
  if (!value) return "";
  if (isEncryptedFormat(value)) {
    try {
      return decryptSecret(value);
    } catch {
      return value;
    }
  }
  return value;
}

function resolveAccessTokenField(row: MercadoPagoConnectionRow): string {
  return row.access_token_encrypted || row.access_token || "";
}

function resolveConnectionStatus(row: MercadoPagoConnectionRow): ConnectionStatus {
  if (row.status) return normalizeStatus(row.status);
  const hasToken = Boolean(row.access_token_encrypted || row.access_token);
  return hasToken ? "connected" : "disconnected";
}

function mapConnectionRow(row: MercadoPagoConnectionRow): TenantMercadoPagoConnection {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id ?? row.tenantId ?? ""),
    mercadoPagoUserId: (row.mercado_pago_user_id ?? row.user_id)
      ? String(row.mercado_pago_user_id ?? row.user_id) : null,
    accessTokenEncrypted: resolveAccessTokenField(row),
    refreshTokenEncrypted: row.refresh_token_encrypted ? String(row.refresh_token_encrypted) : null,
    publicKey: row.public_key ? String(row.public_key) : null,
    status: resolveConnectionStatus(row),
    connectedAt: toIsoOrNull(row.connected_at ?? row.created_at),
    expiresAt: toIsoOrNull(row.expires_at),
    disconnectedAt: toIsoOrNull(row.disconnected_at),
    lastRefreshAt: toIsoOrNull(row.last_refresh_at),
    lastError: row.last_error ? String(row.last_error) : null,
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : null,
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

function requireConnectionsTableId() {
  const tableId = BASEROW_TABLES.MP_CONNECTIONS;
  if (!tableId) {
    throw new ApiError(500, "BASEROW_TABLE_MP_CONNECTIONS is not configured.");
  }
  return tableId;
}

function sanitizeTenantId(tenantId: string | number) {
  return encodeURIComponent(String(tenantId));
}

function isMissingConnectionsTableError(error: unknown) {
  if (!(error instanceof BaserowError) || error.status !== 404) {
    return false;
  }

  const body = error.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }

  return (body as { error?: unknown }).error === "ERROR_TABLE_DOES_NOT_EXIST";
}

async function fetchConnectionRows(
  tableId: number,
  tenantField: "tenant_id" | "tenantId",
  tenantValue: string,
) {
  return fetchBaserow<{ results: MercadoPagoConnectionRow[] }>(
    `/api/database/rows/table/${tableId}/?user_field_names=true&filter__${tenantField}__equal=${sanitizeTenantId(tenantValue)}&order_by=-id`,
  );
}

async function clearLegacySettingsSecrets(tenantId: string | number) {
  const settings = await getSettingsMap(tenantId);
  if (
    !settings.mp_access_token
    && !settings.mp_refresh_token
    && !settings.mp_public_key
    && !settings.mp_user_id
  ) {
    return;
  }

  await saveSettings(tenantId, {
    mp_access_token: "",
    mp_refresh_token: "",
    mp_public_key: "",
    mp_user_id: "",
  });
}

async function queryTenantConnections(tenantId: string | number) {
  const tableId = requireConnectionsTableId();
  const tenantRecord = await getTenantById(tenantId).catch(() => null);
  const tenantKeys = new Set([String(tenantId)]);
  if (tenantRecord?.slug) {
    tenantKeys.add(tenantRecord.slug);
  }

  const rowsById = new Map<string, MercadoPagoConnectionRow>();

  try {
    for (const tenantKey of tenantKeys) {
      for (const tenantField of ["tenant_id", "tenantId"] as const) {
        const rows = await fetchConnectionRows(tableId, tenantField, tenantKey);
        for (const row of rows.results) {
          if (row.id == null) continue;
          rowsById.set(String(row.id), row);
        }
      }
    }
  } catch (error) {
    if (isMissingConnectionsTableError(error)) {
      return [];
    }
    throw error;
  }

  return Array.from(rowsById.values()).sort((left, right) => Number(right.id || 0) - Number(left.id || 0));
}

function getActiveConnectionRow(rows: MercadoPagoConnectionRow[]) {
  return rows.find((row) => normalizeStatus(row.status) === "connected")
    ?? rows.find((row) => normalizeStatus(row.status) === "reconnect_required")
    ?? null;
}

async function markExistingConnectionsAsDisconnected(tenantId: string | number): Promise<string[]> {
  const rows = await queryTenantConnections(tenantId);
  const activeRows = rows.filter((row) => {
    const status = normalizeStatus(row.status);
    return status === "connected" || status === "reconnect_required";
  });
  if (!activeRows.length) return [];

  const now = new Date().toISOString();
  const tableId = requireConnectionsTableId();
  await Promise.all(
    activeRows.map((row) =>
      fetchBaserow(`/api/database/rows/table/${tableId}/${row.id}/?user_field_names=true`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "disconnected",
          disconnected_at: now,
          updated_at: now,
        }),
      })
    ),
  );
  return activeRows.map((row) => String(row.id));
}

async function migrateLegacySettingsConnection(tenantId: string | number): Promise<TenantMercadoPagoConnection | null> {
  const settings = await getSettingsMap(tenantId);
  if (!settings.mp_access_token) return null;

  if (!BASEROW_TABLES.MP_CONNECTIONS) {
    return {
      id: `legacy_${tenantId}`,
      tenantId: String(tenantId),
      mercadoPagoUserId: settings.mp_user_id || null,
      accessTokenEncrypted: encryptSecret(settings.mp_access_token),
      refreshTokenEncrypted: settings.mp_refresh_token ? encryptSecret(settings.mp_refresh_token) : null,
      publicKey: settings.mp_public_key || null,
      status: "connected",
      connectedAt: null,
      expiresAt: null,
      disconnectedAt: null,
      lastRefreshAt: null,
      lastError: null,
      createdByUserId: null,
      updatedAt: null,
    };
  }

  const migrated = await upsertTenantMercadoPagoConnection({
    tenantId,
    actorUserId: "migration",
    mercadoPagoUserId: settings.mp_user_id || "legacy",
    accessToken: settings.mp_access_token,
    refreshToken: settings.mp_refresh_token || null,
    publicKey: settings.mp_public_key || null,
  });

  await clearLegacySettingsSecrets(tenantId);
  await logAuditEvent({
    tenantId: String(tenantId),
    actorType: "system",
    actorId: "migration",
    action: "mercadopago.migration.settings_to_connections",
    resourceType: "mercadopago_connection",
    resourceId: migrated.id,
    payload: { tenantId: String(tenantId) },
  });

  return migrated;
}

export async function getTenantMercadoPagoConnection(tenantId: string | number): Promise<TenantMercadoPagoConnection | null> {
  if (BASEROW_TABLES.MP_CONNECTIONS) {
    const rows = await queryTenantConnections(tenantId);
    const active = getActiveConnectionRow(rows);
    if (active) {
      await clearLegacySettingsSecrets(tenantId);
      return mapConnectionRow(active);
    }

    const latest = rows[0];
    if (latest) {
      await clearLegacySettingsSecrets(tenantId);
      return mapConnectionRow(latest);
    }
  }

  return migrateLegacySettingsConnection(tenantId);
}

export async function requireTenantMercadoPagoConnection(tenantId: string | number) {
  const connection = await getTenantMercadoPagoConnection(tenantId);
  if (!connection) {
    throw new ApiError(409, "Conecte uma conta do Mercado Pago antes de ativar pagamentos.");
  }
  return connection;
}

export function readConnectionSecrets(connection: TenantMercadoPagoConnection) {
  return {
    accessToken: safeReadToken(connection.accessTokenEncrypted),
    refreshToken: connection.refreshTokenEncrypted ? safeReadToken(connection.refreshTokenEncrypted) : null,
  };
}

export async function upsertTenantMercadoPagoConnection(input: {
  tenantId: string | number;
  mercadoPagoUserId: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  publicKey?: string | null;
  actorUserId?: string | null;
}) {
  const tableId = requireConnectionsTableId();
  const existingRows = await queryTenantConnections(input.tenantId);
  const hadActiveConnection = Boolean(getActiveConnectionRow(existingRows));
  const replacedConnectionIds = await markExistingConnectionsAsDisconnected(input.tenantId);

  const now = new Date().toISOString();
  const expiresAt = toExpiresAt(input.expiresIn ?? null);
  const created = await fetchBaserow<MercadoPagoConnectionRow>(`/api/database/rows/table/${tableId}/?user_field_names=true`, {
    method: "POST",
    body: JSON.stringify({
      tenant_id: String(input.tenantId),
      mercado_pago_user_id: String(input.mercadoPagoUserId),
      access_token_encrypted: encryptSecret(input.accessToken),
      refresh_token_encrypted: input.refreshToken ? encryptSecret(input.refreshToken) : "",
      public_key: input.publicKey || "",
      status: "connected",
      connected_at: now,
      expires_at: expiresAt || "",
      disconnected_at: "",
      last_refresh_at: now,
      last_error: "",
      created_by_user_id: input.actorUserId ? String(input.actorUserId) : "",
      updated_at: now,
    }),
  });

  await clearLegacySettingsSecrets(input.tenantId);
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: input.actorUserId ? "admin" : "system",
    actorId: String(input.actorUserId || "system"),
    action: hadActiveConnection ? "mercadopago.reconnect" : "mercadopago.connect",
    resourceType: "mercadopago_connection",
    resourceId: String(created.id),
    payload: {
      mercadoPagoUserId: String(input.mercadoPagoUserId),
      replacedConnectionIds,
    },
  });

  return mapConnectionRow(created);
}

export async function disconnectTenantMercadoPagoConnection(input: {
  tenantId: string | number;
  actorUserId?: string | null;
}) {
  if (!BASEROW_TABLES.MP_CONNECTIONS) {
    await clearLegacySettingsSecrets(input.tenantId);
    return true;
  }

  const tableId = requireConnectionsTableId();
  const rows = await queryTenantConnections(input.tenantId);
  const active = getActiveConnectionRow(rows);
  if (active) {
    const now = new Date().toISOString();
    await fetchBaserow(`/api/database/rows/table/${tableId}/${active.id}/?user_field_names=true`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "disconnected",
        disconnected_at: now,
        updated_at: now,
      }),
    });
  }

  await clearLegacySettingsSecrets(input.tenantId);
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: input.actorUserId ? "admin" : "system",
    actorId: String(input.actorUserId || "system"),
    action: "mercadopago.disconnect",
    resourceType: "mercadopago_connection",
    resourceId: active ? String(active.id) : "none",
    payload: { hadActiveConnection: Boolean(active) },
  });

  return true;
}

export async function markConnectionReconnectRequired(input: {
  tenantId: string | number;
  reason?: string | null;
}) {
  if (!BASEROW_TABLES.MP_CONNECTIONS) return false;

  const tableId = requireConnectionsTableId();
  const rows = await queryTenantConnections(input.tenantId);
  const active = getActiveConnectionRow(rows);
  if (!active) return false;

  const now = new Date().toISOString();
  await fetchBaserow(`/api/database/rows/table/${tableId}/${active.id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "reconnect_required",
      last_error: input.reason || "connection_invalid",
      updated_at: now,
    }),
  });

  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: "system",
    actorId: "system",
    action: "mercadopago.refresh_failed",
    resourceType: "mercadopago_connection",
    resourceId: String(active.id),
    payload: { reason: input.reason || "connection_invalid" },
  });

  return true;
}

export async function refreshMercadoPagoConnection(connectionId: string) {
  const tableId = requireConnectionsTableId();
  const row = await fetchBaserow<MercadoPagoConnectionRow>(`/api/database/rows/table/${tableId}/${connectionId}/?user_field_names=true`).catch(() => null);
  if (!row) {
    throw new ApiError(404, "Mercado Pago connection not found.");
  }

  const connection = mapConnectionRow(row);
  const { refreshToken } = readConnectionSecrets(connection);
  if (!refreshToken) {
    throw new ApiError(409, "A conexão com o Mercado Pago precisa ser refeita.");
  }

  const { clientId, clientSecret } = await getMercadoPagoAppEnvAsync(connection.tenantId);
  const oauthController = new AbortController();
  const oauthTimer = setTimeout(() => oauthController.abort(), 10_000);
  let response: Response;
  try {
    response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      signal: oauthController.signal,
    });
  } catch (fetchError: unknown) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      await markConnectionReconnectRequired({
        tenantId: connection.tenantId,
        reason: "token_refresh_timeout",
      });
      throw new ApiError(
        409,
        "A conexão com o Mercado Pago expirou (timeout no refresh). Reconecte a conta para continuar.",
      );
    }
    throw fetchError;
  } finally {
    clearTimeout(oauthTimer);
  }

  const body = (await response.json().catch(() => null)) as OAuthTokenResponse | null;
  if (!response.ok || !body?.access_token) {
    await markConnectionReconnectRequired({
      tenantId: connection.tenantId,
      reason: "token_refresh_failed",
    });
    throw new ApiError(409, "A conexão com o Mercado Pago expirou. Reconecte a conta para continuar.");
  }

  const now = new Date().toISOString();
  const expiresAt = toExpiresAt(body.expires_in ?? null) ?? connection.expiresAt;
  await fetchBaserow(`/api/database/rows/table/${tableId}/${connection.id}/?user_field_names=true`, {
    method: "PATCH",
    body: JSON.stringify({
      mercado_pago_user_id: String(body.user_id ?? connection.mercadoPagoUserId ?? ""),
      access_token_encrypted: encryptSecret(body.access_token),
      refresh_token_encrypted: body.refresh_token ? encryptSecret(body.refresh_token) : connection.refreshTokenEncrypted || "",
      public_key: body.public_key ?? connection.publicKey ?? "",
      status: "connected",
      expires_at: expiresAt || "",
      last_refresh_at: now,
      last_error: "",
      updated_at: now,
    }),
  });

  const updated = await fetchBaserow<MercadoPagoConnectionRow>(`/api/database/rows/table/${tableId}/${connection.id}/?user_field_names=true`);
  await logAuditEvent({
    tenantId: String(connection.tenantId),
    actorType: "system",
    actorId: "system",
    action: "mercadopago.refresh_success",
    resourceType: "mercadopago_connection",
    resourceId: String(connection.id),
    payload: {
      expiresAt: expiresAt || null,
    },
  });
  return mapConnectionRow(updated);
}

export async function getUsableMercadoPagoAccessToken(tenantId: string) {
  let connection = await requireTenantMercadoPagoConnection(tenantId);
  if (connection.status === "disconnected") {
    throw new ApiError(409, "A conta do Mercado Pago está desconectada.");
  }
  if (connection.status === "reconnect_required") {
    throw new ApiError(409, "A conexão com o Mercado Pago precisa ser refeita.");
  }

  if (isExpiringSoon(connection.expiresAt)) {
    connection = await refreshMercadoPagoConnection(connection.id);
  }

  const accessToken = safeReadToken(connection.accessTokenEncrypted);
  if (!accessToken) {
    await markConnectionReconnectRequired({
      tenantId,
      reason: "access_token_empty",
    });
    throw new ApiError(409, "A conexão com o Mercado Pago está inválida. Reconecte a conta.");
  }
  return { connection, accessToken };
}

function toSortableConnectionTimestamp(row: MercadoPagoConnectionRow) {
  const connectedAt = toIsoOrNull(row.connected_at);
  if (connectedAt) return new Date(connectedAt).getTime();

  const updatedAt = toIsoOrNull(row.updated_at);
  if (updatedAt) return new Date(updatedAt).getTime();

  const numericId = Number(row.id);
  if (Number.isFinite(numericId)) return numericId;
  return 0;
}

export async function repairMercadoPagoActiveConnections() {
  if (!BASEROW_TABLES.MP_CONNECTIONS) {
    return {
      tenantsScanned: 0,
      activeConnectionsScanned: 0,
      repairedTenants: 0,
      disconnectedConnections: 0,
    };
  }

  const tableId = requireConnectionsTableId();
  let page = 1;
  const size = 200;
  const rows: MercadoPagoConnectionRow[] = [];

  while (true) {
    const data = await fetchBaserow<{ results: MercadoPagoConnectionRow[]; next?: string | null }>(
      `/api/database/rows/table/${tableId}/?user_field_names=true&order_by=tenant_id,-id&page=${page}&size=${size}`,
    );
    if (!Array.isArray(data.results) || data.results.length === 0) break;
    rows.push(...data.results);
    if (!data.next) break;
    page += 1;
  }

  const now = new Date().toISOString();
  const byTenant = new Map<string, MercadoPagoConnectionRow[]>();
  for (const row of rows) {
    const tenantId = String(row.tenant_id ?? "");
    if (!tenantId) continue;
    const status = normalizeStatus(row.status);
    if (status !== "connected" && status !== "reconnect_required") continue;
    const tenantRows = byTenant.get(tenantId) ?? [];
    tenantRows.push(row);
    byTenant.set(tenantId, tenantRows);
  }

  let repairedTenants = 0;
  let disconnectedConnections = 0;
  for (const [tenantId, tenantRows] of byTenant.entries()) {
    if (tenantRows.length <= 1) continue;

    const ordered = [...tenantRows].sort(
      (a, b) => toSortableConnectionTimestamp(b) - toSortableConnectionTimestamp(a),
    );
    const keep = ordered[0];
    const stale = ordered.slice(1);
    if (!stale.length) continue;

    await Promise.all(
      stale.map((row) =>
        fetchBaserow(`/api/database/rows/table/${tableId}/${row.id}/?user_field_names=true`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "disconnected",
            disconnected_at: now,
            updated_at: now,
            last_error: "connection_repaired_duplicate_active",
          }),
        }),
      ),
    );

    repairedTenants += 1;
    disconnectedConnections += stale.length;
    await logAuditEvent({
      tenantId,
      actorType: "system",
      actorId: "system",
      action: "mercadopago.connection_repaired",
      resourceType: "mercadopago_connection",
      resourceId: String(keep.id),
      payload: {
        keptConnectionId: String(keep.id),
        disconnectedConnectionIds: stale.map((row) => String(row.id)),
      },
    });
  }

  return {
    tenantsScanned: byTenant.size,
    activeConnectionsScanned: Array.from(byTenant.values()).reduce((acc, list) => acc + list.length, 0),
    repairedTenants,
    disconnectedConnections,
  };
}
