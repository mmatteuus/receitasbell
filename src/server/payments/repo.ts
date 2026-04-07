import type { CartItem } from '../../types/cart.js';
import type { Entitlement as AppEntitlement } from '../../types/entitlement.js';
import type {
  Payment as AdminPayment,
  PaymentEvent,
  PaymentNote,
} from '../../lib/payments/types.js';
import type { PaymentStatus as AppPaymentStatus } from '../../types/payment.js';
import type { RecipeRecord } from '../../lib/recipes/types.js';
import {
  listEntitlementsByEmail,
  type Entitlement as ServerEntitlement,
} from '../identity/entitlements.repo.js';
import { listRecipes } from '../recipes/repo.js';
import { ApiError } from '../shared/http.js';
import { supabaseAdmin } from '../integrations/supabase/client.js';

export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'in_process'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'chargeback'
  | 'charged_back'
  | 'failed';

export type PaymentListFilters = {
  status?: string[];
  paymentMethod?: string[];
  email?: string;
  paymentId?: string;
  paymentIdGateway?: string;
  externalReference?: string;
  dateFrom?: string;
  dateTo?: string;
  from?: string;
  to?: string;
};

type PaymentMetadata = Record<string, unknown> & {
  payerEmail?: string;
  payerName?: string;
  userId?: string;
  sessionId?: string;
};

export interface PaymentRecord {
  id: string;
  tenantId: string;
  userId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  externalReference: string;
  providerPaymentId: string;
  mpPaymentId: string;
  preferenceId: string;
  idempotencyKey: string;
  payerEmail: string;
  paymentMethod: string;
  provider: string;
  recipeIds: string[];
  items: CartItem[];
  metadata?: PaymentMetadata | null;
  providerEventId?: string | null;
  providerMetadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

type PaymentOrderRow = {
  id: string;
  tenant_id: string | number;
  user_id?: string | null;
  amount_cents?: number | string | null;
  currency: string;
  status: string;
  external_reference?: string | null;
  provider_payment_id?: string | null;
  mp_payment_id?: string | null;
  preference_id?: string | null;
  idempotency_key?: string | null;
  payment_method?: string | null;
  provider?: string | null;
  recipe_ids?: string[] | null;
  items?: CartItem[] | null;
  metadata?: Record<string, unknown> | null;
  provider_event_id?: string | null;
  provider_metadata_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type PaymentEventRow = {
  id: string;
  payment_order_id: string | null;
  event_type: string;
  payload?: Record<string, unknown> | null;
  created_at: string;
};

type PaymentOrderUpdates = Partial<PaymentRecord> & {
  providerEventId?: string | null;
  providerMetadata?: Record<string, unknown> | null;
  metadata?: PaymentMetadata | null;
};

export interface PaymentDetailRecord {
  payment: AdminPayment;
  events: PaymentEvent[];
  notes: PaymentNote[];
  recipes: RecipeRecord[];
  entitlements: AppEntitlement[];
}

export async function createPaymentOrder(
  tenantId: string,
  input: {
    userId?: string | null;
    amount: number;
    currency?: string;
    status: PaymentStatus;
    externalReference: string;
    idempotencyKey: string;
    payerEmail: string;
    paymentMethod: string;
    provider?: string;
    recipeIds: string[];
    items: CartItem[];
  }
): Promise<PaymentRecord> {
  const normalizedEmail = input.payerEmail.toLowerCase().trim();

  const { data, error } = await supabaseAdmin
    .from('payment_orders')
    .insert({
      tenant_id: tenantId,
      user_id: input.userId || null,
      amount_cents: input.amount,
      currency: input.currency || 'BRL',
      status: input.status,
      external_reference: input.externalReference,
      idempotency_key: input.idempotencyKey,
      payment_method: input.paymentMethod,
      provider: input.provider || 'stripe',
      recipe_ids: input.recipeIds,
      items: input.items,
      metadata: {
        payerEmail: normalizedEmail,
        userId: input.userId || '',
      },
    })
    .select()
    .single();

  if (error) throw new ApiError(500, 'Erro ao criar pedido de pagamento', { original: error });
  return mapRowToPayment(data as PaymentOrderRow);
}

export async function getPaymentOrderById(
  tenantId: string,
  id: string
): Promise<PaymentRecord | null> {
  const { data, error } = await supabaseAdmin.from('payment_orders').select('*').eq('id', id).single();

  if (error || !data) return null;
  if (String(data.tenant_id) !== String(tenantId)) return null;
  return mapRowToPayment(data as PaymentOrderRow);
}

export async function getPaymentOrderByExternalReference(
  tenantId: string,
  externalReference: string
): Promise<PaymentRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('payment_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('external_reference', externalReference)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToPayment(data as PaymentOrderRow);
}

export async function findPaymentOrderByIdempotencyKey(
  tenantId: string,
  idempotencyKey: string
): Promise<PaymentRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('payment_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToPayment(data as PaymentOrderRow);
}

export async function updatePaymentOrderStatus(
  tenantId: string,
  id: string,
  status: string,
  mpPaymentId?: string
): Promise<void> {
  await updatePaymentOrderInternal(tenantId, id, {
    status: status as PaymentStatus,
    providerPaymentId: mpPaymentId,
  });
}

export async function updatePaymentOrderInternal(
  tenantId: string,
  id: string,
  updates: PaymentOrderUpdates
): Promise<void> {
  const rowUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status) rowUpdates.status = updates.status;
  if (updates.providerPaymentId) rowUpdates.provider_payment_id = updates.providerPaymentId;
  if (updates.mpPaymentId) rowUpdates.mp_payment_id = updates.mpPaymentId;
  if (updates.preferenceId) rowUpdates.preference_id = updates.preferenceId;
  if (updates.providerEventId !== undefined) rowUpdates.provider_event_id = updates.providerEventId;
  if (updates.providerMetadata !== undefined) rowUpdates.provider_metadata_json = updates.providerMetadata;
  if (updates.metadata !== undefined) rowUpdates.metadata = updates.metadata;

  const { error } = await supabaseAdmin
    .from('payment_orders')
    .update(rowUpdates)
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw new ApiError(500, 'Erro ao atualizar pedido de pagamento', { original: error });
}

export async function setPaymentOrderExternalReference(
  tenantId: string,
  id: string | number,
  externalReference: string
): Promise<void> {
  await supabaseAdmin
    .from('payment_orders')
    .update({ external_reference: externalReference, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId);
}

export async function setPaymentOrderPreferenceId(
  tenantId: string,
  id: string | number,
  preferenceId: string
): Promise<void> {
  await supabaseAdmin
    .from('payment_orders')
    .update({ preference_id: preferenceId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId);
}

export async function listPayments(
  tenantId: string,
  filters: PaymentListFilters = {}
): Promise<AdminPayment[]> {
  let query = supabaseAdmin
    .from('payment_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const orders = (data || []).map((row) => mapRowToPayment(row as PaymentOrderRow));

  return orders
    .map((order) => mapPaymentRecordToAdminPayment(order))
    .filter((payment) => matchesPaymentFilters(payment, filters));
}

export async function getPaymentById(tenantId: string, id: string): Promise<AdminPayment | null> {
  const order = await getPaymentOrderById(tenantId, id);
  if (!order) return null;
  return mapPaymentRecordToAdminPayment(order);
}

export async function getPaymentDetailById(
  tenantId: string,
  id: string
): Promise<PaymentDetailRecord | null> {
  const order = await getPaymentOrderById(tenantId, id);
  if (!order) return null;

  const recipeIndex = await buildRecipeIndex(tenantId, [order]);
  const [notes, entitlements, events] = await Promise.all([
    listPaymentNotes(tenantId, order.id),
    order.payerEmail ? listEntitlementsByEmail(tenantId, order.payerEmail) : Promise.resolve([]),
    listPaymentEvents(tenantId, order.id),
  ]);

  const payment = mapPaymentRecordToAdminPayment(order);
  const recipes = order.recipeIds
    .map((recipeId) => recipeIndex.get(String(recipeId)))
    .filter((recipe): recipe is RecipeRecord => Boolean(recipe));

  return {
    payment,
    events,
    notes,
    recipes,
    entitlements: entitlements
      .filter((entitlement) => String(entitlement.paymentId) === String(order.id))
      .map(mapEntitlementToAppEntitlement),
  };
}

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
};

async function listPaymentEvents(tenantId: string, paymentId: string): Promise<PaymentEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('payment_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('payment_order_id', String(paymentId))
    .order('created_at', { ascending: false });

  if (error) return [];

  return (data || []).map((row) => {
    const eventRow = row as PaymentEventRow;
    return {
      id: String(eventRow.id),
      paymentId: String(eventRow.payment_order_id || paymentId),
      type: String(eventRow.event_type),
      date_created: eventRow.created_at,
      payload_json: (eventRow.payload || null) as Record<string, unknown> | null,
    };
  });
}

async function listPaymentNotes(tenantId: string, paymentId: string): Promise<PaymentNote[]> {
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('resource_type', 'payment_order')
    .eq('resource_id', String(paymentId))
    .eq('action', 'payment.note_added')
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data || []).map((row: AuditLogRow) => ({
    id: String(row.id),
    payment_id: String(paymentId),
    note: String((row.payload?.note ?? '') as string),
    created_by_user_id: String(row.actor_id ?? ''),
    created_at: row.created_at,
    updated_at: row.created_at,
  }));
}

export async function createPaymentNote(input: {
  tenantId: string;
  paymentId: string;
  note: string;
  actorType: string;
  actorId: string;
  ip?: string;
  userAgent?: string;
}): Promise<PaymentNote> {
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .insert({
      tenant_id: input.tenantId,
      actor_type: input.actorType,
      actor_id: input.actorId,
      action: 'payment.note_added',
      resource_type: 'payment_order',
      resource_id: String(input.paymentId),
      payload: { note: input.note, ip: input.ip, user_agent: input.userAgent },
    })
    .select()
    .single();

  if (error || !data) throw error;
  const payloadNote =
    data.payload && typeof data.payload === 'object'
      ? String((data.payload as Record<string, unknown>).note ?? '')
      : '';
  return {
    id: String(data.id),
    payment_id: String(input.paymentId),
    note: payloadNote,
    created_by_user_id: String(data.actor_id || ''),
    created_at: data.created_at,
    updated_at: data.created_at,
  };
}

async function buildRecipeIndex(
  tenantId: string,
  payments: PaymentRecord[]
): Promise<Map<string, RecipeRecord>> {
  const uniqueRecipeIds = new Set<string>();
  for (const payment of payments) {
    for (const id of payment.recipeIds) uniqueRecipeIds.add(String(id));
  }
  if (uniqueRecipeIds.size === 0) return new Map();

  const recipes = await listRecipes(tenantId, {
    includeDrafts: true,
    ids: [...uniqueRecipeIds],
  });

  return new Map(recipes.map((recipe) => [String(recipe.id), recipe]));
}

function mapRowToPayment(row: PaymentOrderRow): PaymentRecord {
  const metadata = normalizeMetadata(row.metadata);
  const payerEmail = readString(metadata.payerEmail);
  const amountCents = Number(row.amount_cents ?? 0);

  return {
    id: row.id,
    tenantId: String(row.tenant_id),
    userId: row.user_id ? String(row.user_id) : null,
    amount: Number.isFinite(amountCents) ? amountCents : 0,
    currency: row.currency,
    status: row.status as PaymentStatus,
    externalReference: row.external_reference || '',
    providerPaymentId: row.provider_payment_id || row.mp_payment_id || '',
    mpPaymentId: row.mp_payment_id || '',
    preferenceId: row.preference_id || '',
    idempotencyKey: row.idempotency_key || '',
    payerEmail,
    paymentMethod: row.payment_method || '',
    provider: row.provider || 'stripe',
    recipeIds: Array.isArray(row.recipe_ids) ? row.recipe_ids.map(String) : [],
    items: Array.isArray(row.items) ? row.items : [],
    metadata,
    providerEventId: row.provider_event_id || null,
    providerMetadata: row.provider_metadata_json || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPaymentRecordToAdminPayment(payment: PaymentRecord): AdminPayment {
  const status = normalizeAppPaymentStatus(payment.status);
  const payerEmail = payment.payerEmail || readString(payment.metadata?.payerEmail);
  const payerName = readString(payment.metadata?.payerName) || (payerEmail ? payerEmail.split('@')[0] : 'cliente');

  return {
    id: String(payment.id),
    paymentIdGateway: payment.providerPaymentId || payment.mpPaymentId || '',
    gateway: payment.provider === 'mock' ? 'mock' : 'stripe',
    recipeIds: payment.recipeIds.map(String),
    totalBRL: Number((payment.amount / 100).toFixed(2)),
    payerName,
    payerEmail,
    payer: { email: payerEmail },
    status,
    statusDetail: '',
    paymentMethod: payment.paymentMethod || 'pending',
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    items: payment.items.map((item) => ({
      ...item,
      recipeId: String(item.recipeId),
    })),
    approvedAt: status === 'approved' ? payment.updatedAt : null,
    paymentType: payment.paymentMethod || null,
    paymentMethodKey: payment.paymentMethod,
    checkoutReference: payment.externalReference || null,
    webhookReceivedAt: payment.providerEventId ? payment.updatedAt : null,
  };
}

function normalizeAppPaymentStatus(value: PaymentStatus): AppPaymentStatus {
  switch (value) {
    case 'approved':
      return 'approved';
    case 'in_process':
      return 'in_process';
    case 'rejected':
    case 'failed':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
      return 'refunded';
    case 'chargeback':
    case 'charged_back':
      return 'charged_back';
    case 'created':
    case 'pending':
    default:
      return 'pending';
  }
}

function mapEntitlementToAppEntitlement(entitlement: ServerEntitlement): AppEntitlement {
  return {
    id: String(entitlement.id),
    paymentId: String(entitlement.paymentId),
    payerEmail: entitlement.payerEmail,
    recipeSlug: entitlement.recipeSlug,
    accessStatus: entitlement.accessStatus === 'revoked' ? 'revoked' : 'active',
    createdAt: entitlement.createdAt,
    updatedAt: entitlement.updatedAt,
  };
}

function matchesPaymentFilters(payment: AdminPayment, filters: PaymentListFilters) {
  if (filters.paymentId && !String(payment.id).includes(filters.paymentId)) return false;
  if (filters.paymentIdGateway && !String(payment.paymentIdGateway).includes(filters.paymentIdGateway)) {
    return false;
  }
  if (filters.externalReference && !String(payment.checkoutReference || '').includes(filters.externalReference)) {
    return false;
  }
  if (filters.email && !String(payment.payerEmail || '').toLowerCase().includes(filters.email.toLowerCase())) {
    return false;
  }

  const from = filters.dateFrom || filters.from;
  const to = filters.dateTo || filters.to;
  if (from) {
    const fromTime = new Date(from).getTime();
    if (!Number.isNaN(fromTime) && new Date(payment.createdAt).getTime() < fromTime) return false;
  }
  if (to) {
    const toTime = new Date(to).getTime();
    if (!Number.isNaN(toTime) && new Date(payment.createdAt).getTime() > toTime) return false;
  }

  return true;
}

function normalizeMetadata(value: Record<string, unknown> | null | undefined): PaymentMetadata {
  return value && typeof value === 'object' ? (value as PaymentMetadata) : {};
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
