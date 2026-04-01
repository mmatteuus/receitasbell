import type { AdminPaymentsFilters, Payment, PaymentNote } from '@/lib/payments/types';
import type { AdminPaymentSettingsResponse } from '@/types/payment';
import type { RecipeRecord } from '@/lib/recipes/types';
import type { Entitlement } from '@/types/entitlement';
import { buildQuery, jsonFetch } from './client';

export interface PaymentDetailResponse {
  payment: Payment;
  events: Array<{
    id: string;
    paymentId: string;
    type: string;
    date_created: string;
    payload_json?: Record<string, unknown> | null;
  }>;
  notes: PaymentNote[];
  recipes?: RecipeRecord[];
  entitlements?: Entitlement[];
}

export async function listPayments(filters: AdminPaymentsFilters = {}) {
  const query = buildQuery({
    status: filters.status,
    method: filters.paymentMethod,
    email: filters.email,
    paymentId: filters.paymentId || filters.paymentIdGateway,
    paymentIdGateway: filters.paymentIdGateway,
    externalReference: filters.externalReference,
    dateFrom: filters.dateFrom || filters.from,
    dateTo: filters.dateTo || filters.to,
    from: filters.from,
    to: filters.to,
  });
  const result = await jsonFetch<{ payments: Payment[] }>(`/api/admin/payments${query}`, {
    admin: true,
  });
  return result.payments;
}

export async function getPayment(id: string) {
  return jsonFetch<PaymentDetailResponse>(`/api/admin/payments/${encodeURIComponent(id)}`, {
    admin: true,
  });
}

export async function addPaymentNote(paymentId: string, note: string) {
  const result = await jsonFetch<{ note: PaymentNote }>(
    `/api/admin/payments/${encodeURIComponent(paymentId)}/note`,
    {
      method: 'POST',
      admin: true,
      body: { note },
    }
  );
  return result.note;
}

export async function getAdminPaymentSettings() {
  const result = await jsonFetch<{ settings: AdminPaymentSettingsResponse }>(
    '/api/admin/payments/settings',
    {
      admin: true,
    }
  );
  return result.settings;
}

export async function startStripeConnect(returnTo?: string) {
  const result = await jsonFetch<{ onboardingUrl: string }>(
    '/api/payments/connect/onboarding-link',
    {
      method: 'POST',
      admin: true,
      body: { returnTo },
    }
  );
  return result.onboardingUrl;
}

export async function getStripeConnectStatus() {
  return jsonFetch<{
    connected: boolean;
    details_submitted: boolean;
    charges_enabled: boolean;
    accountId?: string;
  }>('/api/payments/connect/status', { admin: true });
}

export async function createStripeConnectAccount(returnTo?: string) {
  return jsonFetch<{ accountId: string; onboardingUrl: string }>('/api/payments/connect/account', {
    method: 'POST',
    admin: true,
    body: returnTo ? { returnTo } : {},
  });
}
