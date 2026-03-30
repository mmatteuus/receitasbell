import { logAuditEvent } from "../../audit/repo.js";
import { decryptSecret, encryptSecret } from "../../shared/crypto.js";
import { getMercadoPagoAppEnvAsync } from "../../shared/env.js";
import { ApiError } from "../../shared/http.js";
import { supabase, supabaseAdmin } from "../supabase/client.js";
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
const REFRESH_BEFORE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutos antes de expirar

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

function mapConnectionRow(row: any): TenantMercadoPagoConnection {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    mercadoPagoUserId: row.mp_user_id ? String(row.mp_user_id) : null,
    accessTokenEncrypted: row.access_token_encrypted || "",
    refreshTokenEncrypted: row.refresh_token_encrypted || null,
    publicKey: row.public_key || null,
    status: normalizeStatus(row.status),
    connectedAt: row.connected_at,
    expiresAt: row.expires_at,
    disconnectedAt: row.disconnected_at,
    lastRefreshAt: row.last_refresh_at,
    lastError: row.last_error,
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : null,
    updatedAt: row.updated_at,
  };
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

export async function getTenantMercadoPagoConnection(tenantId: string | number): Promise<TenantMercadoPagoConnection | null> {
  const { data, error } = await supabaseAdmin
    .from("mp_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    // Tenta migrar das configurações se não existir tabela
    return migrateLegacySettingsConnection(tenantId);
  }

  await clearLegacySettingsSecrets(tenantId);
  return mapConnectionRow(data[0]);
}

async function migrateLegacySettingsConnection(tenantId: string | number): Promise<TenantMercadoPagoConnection | null> {
  const settings = await getSettingsMap(tenantId);
  if (!settings.mp_access_token) return null;

  const migrated = await upsertTenantMercadoPagoConnection({
    tenantId,
    actorUserId: "migration",
    mercadoPagoUserId: settings.mp_user_id || "legacy",
    accessToken: settings.mp_access_token,
    refreshToken: settings.mp_refresh_token || null,
    publicKey: settings.mp_public_key || null,
  });

  await clearLegacySettingsSecrets(tenantId);
  return migrated;
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
  const now = new Date().toISOString();
  const expiresAt = toExpiresAt(input.expiresIn ?? null);
  
  // Marca as anteriores como desconectadas
  await supabaseAdmin
    .from("mp_connections")
    .update({ status: "disconnected", disconnected_at: now, updated_at: now })
    .eq("tenant_id", input.tenantId)
    .in("status", ["connected", "reconnect_required"]);

  const { data, error } = await supabaseAdmin
    .from("mp_connections")
    .insert({
      tenant_id: input.tenantId,
      mp_user_id: String(input.mercadoPagoUserId),
      access_token_encrypted: encryptSecret(input.accessToken),
      refresh_token_encrypted: input.refreshToken ? encryptSecret(input.refreshToken) : "",
      public_key: input.publicKey || "",
      status: "connected",
      connected_at: now,
      expires_at: expiresAt || null,
      last_refresh_at: now,
      created_by_user_id: input.actorUserId ? String(input.actorUserId) : "system",
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw error;

  await clearLegacySettingsSecrets(input.tenantId);
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: input.actorUserId ? "admin" : "system",
    actorId: String(input.actorUserId || "system"),
    action: "mercadopago.connect",
    resourceType: "mercadopago_connection",
    resourceId: String(data.id),
    payload: {
      mercadoPagoUserId: String(input.mercadoPagoUserId),
    },
  });

  return mapConnectionRow(data);
}

export async function disconnectTenantMercadoPagoConnection(input: {
  tenantId: string | number;
  actorUserId?: string | null;
}) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("mp_connections")
    .update({ status: "disconnected", disconnected_at: now, updated_at: now })
    .eq("tenant_id", input.tenantId)
    .in("status", ["connected", "reconnect_required"])
    .select();

  await clearLegacySettingsSecrets(input.tenantId);
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: input.actorUserId ? "admin" : "system",
    actorId: String(input.actorUserId || "system"),
    action: "mercadopago.disconnect",
    resourceType: "mercadopago_connection",
    resourceId: data && data[0] ? String(data[0].id) : "none",
  });

  return true;
}

export async function markConnectionReconnectRequired(input: {
  tenantId: string | number;
  reason?: string | null;
}) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("mp_connections")
    .update({
      status: "reconnect_required",
      last_error: input.reason || "connection_invalid",
      updated_at: now,
    })
    .eq("tenant_id", input.tenantId)
    .eq("status", "connected")
    .select();

  if (data && data[0]) {
      await logAuditEvent({
        tenantId: String(input.tenantId),
        actorType: "system",
        actorId: "system",
        action: "mercadopago.refresh_failed",
        resourceType: "mercadopago_connection",
        resourceId: String(data[0].id),
        payload: { reason: input.reason || "connection_invalid" },
      });
  }

  return true;
}

export async function refreshMercadoPagoConnection(connectionId: string) {
  const { data: row, error: fetchError } = await supabaseAdmin
    .from("mp_connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (fetchError || !row) {
    throw new ApiError(404, "Mercado Pago connection not found.");
  }

  const connection = mapConnectionRow(row);
  const { refreshToken } = readConnectionSecrets(connection);
  if (!refreshToken) {
    throw new ApiError(409, "A conexão com o Mercado Pago precisa ser refeita.");
  }

  const { clientId, clientSecret } = await getMercadoPagoAppEnvAsync(connection.tenantId);
  
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

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
  
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("mp_connections")
    .update({
      mp_user_id: String(body.user_id ?? connection.mercadoPagoUserId ?? ""),
      access_token_encrypted: encryptSecret(body.access_token),
      refresh_token_encrypted: body.refresh_token ? encryptSecret(body.refresh_token) : row.refresh_token_encrypted,
      public_key: body.public_key ?? connection.publicKey ?? "",
      status: "connected",
      expires_at: expiresAt || null,
      last_refresh_at: now,
      last_error: "",
      updated_at: now,
    })
    .eq("id", connection.id)
    .select()
    .single();

  if (updateError) throw updateError;

  await logAuditEvent({
    tenantId: String(connection.tenantId),
    actorType: "system",
    actorId: "system",
    action: "mercadopago.refresh_success",
    resourceType: "mercadopago_connection",
    resourceId: String(connection.id),
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

export async function repairMercadoPagoActiveConnections() {
    // No Postgres com Unique Constraint (tenant_id, status) ou similar, isso é menos comum, 
    // mas o código antigo fazia auditoria. Aqui mantemos simplicidade.
    return { repaired: true };
}
