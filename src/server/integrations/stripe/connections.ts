// src/server/integrations/stripe/connections.ts
import { logAuditEvent } from '../../audit/repo.js';
import { decryptSecret, encryptSecret } from '../../shared/crypto.js';
import { ApiError } from '../../shared/http.js';
import { supabaseAdmin } from '../../integrations/supabase/client.js';
import { getTenantById } from '../../tenancy/repo.js';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnect_required';

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
  id: string;
  tenant_id: string | number;
  stripe_account_id: string;
  access_token_encrypted: string;
  scope: string;
  status: string;
  connected_at: string;
  disconnected_at: string | null;
  last_error: string | null;
  created_by_user_id: string | number | null;
  updated_at: string;
  created_at: string;
};

function normalizeStatus(value: unknown): ConnectionStatus {
  if (value === 'connected') return 'connected';
  if (value === 'reconnect_required') return 'reconnect_required';
  return 'disconnected';
}

function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function mapRow(row: StripeConnectionRow): TenantStripeConnection {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id ?? ''),
    stripeAccountId: String(row.stripe_account_id ?? ''),
    accessTokenEncrypted: String(row.access_token_encrypted ?? ''),
    scope: row.scope ? String(row.scope) : null,
    status: normalizeStatus(row.status),
    connectedAt: toIsoOrNull(row.connected_at ?? row.created_at),
    disconnectedAt: toIsoOrNull(row.disconnected_at),
    lastError: row.last_error ? String(row.last_error) : null,
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : null,
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

async function queryConnections(tenantId: string): Promise<StripeConnectionRow[]> {
  const tenantRecord = await getTenantById(tenantId).catch(() => null);
  const keys = new Set([String(tenantId)]);
  if ((tenantRecord as { slug?: string } | null)?.slug)
    keys.add((tenantRecord as { slug: string }).slug);

  const { data, error } = await supabaseAdmin
    .from('stripe_connections')
    .select('*')
    .in('tenant_id', Array.from(keys))
    .order('id', { ascending: false });

  if (error) return [];
  return data || [];
}

function getActiveRow(rows: StripeConnectionRow[]): StripeConnectionRow | null {
  return (
    rows.find((r) => normalizeStatus(r.status) === 'connected') ??
    rows.find((r) => normalizeStatus(r.status) === 'reconnect_required') ??
    null
  );
}

async function markExistingAsDisconnected(tenantId: string): Promise<string[]> {
  const rows = await queryConnections(tenantId);
  const active = rows.filter((r) => {
    const s = normalizeStatus(r.status);
    return s === 'connected' || s === 'reconnect_required';
  });
  if (!active.length) return [];
  const now = new Date().toISOString();
  await supabaseAdmin
    .from('stripe_connections')
    .update({ status: 'disconnected', disconnected_at: now, updated_at: now })
    .in(
      'id',
      active.map((r) => r.id)
    );
  return active.map((r) => String(r.id));
}

export async function getTenantStripeConnection(
  tenantId: string
): Promise<TenantStripeConnection | null> {
  const rows = await queryConnections(tenantId);
  const active = getActiveRow(rows);
  if (active) return mapRow(active);
  const latest = rows[0];
  return latest ? mapRow(latest) : null;
}

export async function requireTenantStripeConnection(tenantId: string) {
  const c = await getTenantStripeConnection(tenantId);
  if (!c) throw new ApiError(409, 'Conecte uma conta Stripe antes de ativar pagamentos.');
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
  const existing = await queryConnections(input.tenantId);
  const hadActive = Boolean(getActiveRow(existing));
  const replacedIds = await markExistingAsDisconnected(input.tenantId);
  const now = new Date().toISOString();

  const { data: created, error } = await supabaseAdmin
    .from('stripe_connections')
    .insert({
      tenant_id: String(input.tenantId),
      stripe_account_id: input.stripeAccountId,
      access_token_encrypted: encryptSecret(input.accessToken),
      scope: input.scope || '',
      status: 'connected',
      connected_at: now,
      last_error: '',
      created_by_user_id: input.actorUserId ? String(input.actorUserId) : null,
      updated_at: now,
      created_at: now,
    })
    .select()
    .single();

  if (error) throw new ApiError(500, 'Erro ao salvar conexao Stripe', { original: error });

  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: input.actorUserId ? 'admin' : 'system',
    actorId: String(input.actorUserId || 'system'),
    action: hadActive ? 'stripe.reconnect' : 'stripe.connect',
    resourceType: 'stripe_connection',
    resourceId: String(created.id),
    payload: { stripeAccountId: input.stripeAccountId, replacedIds },
  });
  return mapRow(created);
}

export async function disconnectTenantStripeConnection(input: {
  tenantId: string;
  actorUserId?: string | null;
}): Promise<boolean> {
  const rows = await queryConnections(input.tenantId);
  const active = getActiveRow(rows);
  if (active) {
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('stripe_connections')
      .update({ status: 'disconnected', disconnected_at: now, updated_at: now })
      .eq('id', active.id);
  }
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: input.actorUserId ? 'admin' : 'system',
    actorId: String(input.actorUserId || 'system'),
    action: 'stripe.disconnect',
    resourceType: 'stripe_connection',
    resourceId: active ? String(active.id) : 'none',
    payload: { hadActive: Boolean(active) },
  });
  return true;
}

export async function markStripeConnectionReconnectRequired(input: {
  tenantId: string;
  reason?: string | null;
}): Promise<boolean> {
  const rows = await queryConnections(input.tenantId);
  const active = getActiveRow(rows);
  if (!active) return false;
  const now = new Date().toISOString();
  await supabaseAdmin
    .from('stripe_connections')
    .update({
      status: 'reconnect_required',
      last_error: input.reason || 'connection_invalid',
      updated_at: now,
    })
    .eq('id', active.id);
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: 'system',
    actorId: 'system',
    action: 'stripe.connection_error',
    resourceType: 'stripe_connection',
    resourceId: String(active.id),
    payload: { reason: input.reason || 'connection_invalid' },
  });
  return true;
}

export async function getUsableStripeAccountId(tenantId: string): Promise<{
  connection: TenantStripeConnection;
  stripeAccountId: string;
  accessToken: string;
}> {
  const connection = await requireTenantStripeConnection(tenantId);
  if (connection.status === 'disconnected')
    throw new ApiError(409, 'A conta Stripe esta desconectada.');
  if (connection.status === 'reconnect_required')
    throw new ApiError(409, 'A conexao Stripe precisa ser refeita.');
  const { accessToken } = readStripeConnectionSecrets(connection);
  if (!accessToken) {
    await markStripeConnectionReconnectRequired({ tenantId, reason: 'access_token_empty' });
    throw new ApiError(409, 'A conexao Stripe esta invalida. Reconecte a conta.');
  }
  return { connection, stripeAccountId: connection.stripeAccountId, accessToken };
}
