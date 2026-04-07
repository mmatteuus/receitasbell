import type { CartItem } from '../../types/cart.js';
import type { Entitlement as AppEntitlement } from '../../types/entitlement.js';
import type {
  Payment as AdminPayment,
  PaymentEvent,
  PaymentNote,
} from '../../lib/payments/types.js';
import type { PaymentStatus as AppPaymentStatus } from '../../types/payment.js';
import type { RecipeRecord } from '../../lib/recipes/types.js';
import { listRecipes } from '../recipes/repo.js';
import { ApiError } from '../shared/http.js';
import { supabase, supabaseAdmin } from '../integrations/supabase/client.js';

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

export interface PaymentRecord {
  id: string;
  tenantId: string;
  userId?: string | null;
  amount: number; // em centavos (amount_cents do banco)
  currency: string;
  status: PaymentStatus;
  externalReference: string;
  providerPaymentId: string;
  idempotencyKey: string;
  paymentMethod: string;
  provider: string;
  recipeIds: string[];
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

type PaymentOrderRow = {
  id: string;
  tenant_id: string | number;
  user_id?: string | null;
  amount: number | string; // amount_cents no banco
  currency: string;
  status: string;
  external_reference?: string;
  provider_payment_id?: string | null;
  idempotency_key?: string | null;
  payment_method?: string | null;
  provider?: string | null;
  items_json?: CartItem[] | null;
  created_at: string;
  updated_at: string;
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
    paymentMethod: string;
    provider?: string;
    recipeIds: string[];
    items: CartItem[];
  }
): Promise<PaymentRecord> {
  const { data, error } = await supabaseAdmin
    .from('payment_orders')
    .insert({
      tenant_id: tenantId,
      user_id: input.userId || null,
      amount: input.amount, // em centavos (amount_cents)
      currency: input.currency || 'BRL',
      status: input.status,
      external_reference: input.externalReference,
      idempotency_key: input.idempotencyKey,
      payment_method: input.paymentMethod,
      provider: input.provider || 'stripe',
      items_json: input.items,
    })
    .select()
    .single();

  if (error) throw new ApiError(500, 'Erro ao criar pedido de pagamento', { original: error });
  return mapRowToPayment(data);
}

export async function getPaymentOrderById(
  tenantId: string,
  id: string
): Promise<PaymentRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('payment_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  if (String(data.tenant_id) !== String(tenantId)) return null;
  return mapRowToPayment(data);
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
  return mapRowToPayment(data);
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
  return mapRowToPayment(data);
}

export async function updatePaymentOrderStatus(
  tenantId: string,
  id: string,
  status: string,
  providerPaymentId?: string
): Promise<void> {
  await updatePaymentOrderInternal(tenantId, id, {
    status: status as PaymentStatus,
    providerPaymentId,
  });
}

export async function updatePaymentOrderInternal(
  tenantId: string,
  id: string,
  updates: Partial<PaymentRecord>
): Promise<void> {
  const rowUpdates: Partial<PaymentOrderRow> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status) rowUpdates.status = updates.status;
  if (updates.providerPaymentId) rowUpdates.provider_payment_id = updates.providerPaymentId;

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

  const orders = (data || []).map(mapRowToPayment);
  const recipeIndex = await buildRecipeIndex(tenantId, orders);

  return orders
    .map((order) => mapPaymentRecordToAdminPayment(order, recipeIndex))
    .filter((payment) => matchesPaymentFilters(payment, filters));
}

export async function getPaymentById(tenantId: string, id: string): Promise<AdminPayment | null> {
  const order = await getPaymentOrderById(tenantId, id);
  if (!order) return null;
  const recipeIndex = await buildRecipeIndex(tenantId, [order]);
  return mapPaymentRecordToAdminPayment(order, recipeIndex);
}

export async function getPaymentDetailById(
  tenantId: string,
  id: string
): Promise<PaymentDetailRecord | null> {
  const order = await getPaymentOrderById(tenantId, id);
  if (!order) return null;

  const recipeIndex = await buildRecipeIndex(tenantId, [order]);
  const notes = await listPaymentNotes(tenantId, order.id);

  const payment = mapPaymentRecordToAdminPayment(order, recipeIndex);
  const recipes = order.recipeIds
    .map((recipeId) => recipeIndex.get(String(recipeId)))
    .filter((recipe): recipe is RecipeRecord => Boolean(recipe));

  return {
    payment,
    events: [], // Carregados da tabela payment_events se necessário
    notes,
    recipes,
    entitlements: [], // Carregados via entitlements.repo.ts
  };
}

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
};

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
  return {
    id: row.id,
    tenantId: String(row.tenant_id),
    userId: row.user_id ? String(row.user_id) : null,
    amount: Number(row.amount), // em centavos
    currency: row.currency,
    status: row.status as PaymentStatus,
    externalReference: row.external_reference || '',
    providerPaymentId: row.provider_payment_id || '',
    idempotencyKey: row.idempotency_key || '',
    paymentMethod: row.payment_method || '',
    provider: row.provider || 'stripe',
    recipeIds: [], // Usar items_json para inferir
    items: Array.isArray(row.items_json) ? row.items_json : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPaymentRecordToAdminPayment(
  payment: PaymentRecord,
  recipeIndex: Map<string, RecipeRecord>
): AdminPayment {
  const status = normalizeAppPaymentStatus(payment.status);
  const recipeIds = payment.items.map((item) => String(item.recipeId));

  return {
    id: String(payment.id),
    paymentIdGateway: payment.providerPaymentId || '',
    gateway: payment.provider === 'mock' ? 'mock' : 'stripe',
    recipeIds,
    totalBRL: payment.amount,
    payerName: payment.userId || 'Anônimo',
    payerEmail: payment.userId || '',
    payer: { email: payment.userId || '' },
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
    webhookReceivedAt: null,
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

function matchesPaymentFilters(payment: AdminPayment, filters: PaymentListFilters) {
  if (filters.paymentId && !String(payment.id).includes(filters.paymentId)) return false;
  return true;
}
