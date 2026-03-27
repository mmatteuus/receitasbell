import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const adminGuardsMock = vi.hoisted(() => ({
  requireAdminAccess: vi.fn(),
}));
const tenancyMock = vi.hoisted(() => ({
  requireTenantFromRequest: vi.fn(),
}));
const paymentsRepoMock = vi.hoisted(() => ({
  listPayments: vi.fn(),
  getPaymentById: vi.fn(),
  getPaymentDetailById: vi.fn(),
  createPaymentNote: vi.fn(),
}));
const csrfMock = vi.hoisted(() => ({
  requireCsrf: vi.fn(),
}));

vi.mock('../src/server/admin/guards.js', () => adminGuardsMock);
vi.mock('../src/server/tenancy/resolver.js', () => tenancyMock);
vi.mock('../src/server/payments/repo.js', () => paymentsRepoMock);
vi.mock('../src/server/security/csrf.js', () => csrfMock);

import adminHandler from '../api/admin/[...path]';

function buildRes() {
  const state: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const res = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
    setHeader(key: string, value: string) {
      state.headers[key] = value;
    },
    getHeader(key: string) {
      return state.headers[key];
    },
    _state: state,
  };
  return res as unknown as VercelResponse & { _state: typeof state };
}

describe('admin payments api', () => {
  beforeEach(() => {
    adminGuardsMock.requireAdminAccess.mockReset();
    tenancyMock.requireTenantFromRequest.mockReset();
    paymentsRepoMock.listPayments.mockReset();
    paymentsRepoMock.getPaymentById.mockReset();
    paymentsRepoMock.getPaymentDetailById.mockReset();
    paymentsRepoMock.createPaymentNote.mockReset();
    csrfMock.requireCsrf.mockReset();

    adminGuardsMock.requireAdminAccess.mockResolvedValue({
      type: 'session',
      userId: 'admin-1',
      role: 'owner',
      email: 'admin@example.com',
      tenantId: 'tenant-1',
    });
    tenancyMock.requireTenantFromRequest.mockResolvedValue({
      tenant: { id: 'tenant-1' },
    });
  });

  test('lista pagamentos no contrato do frontend', async () => {
    paymentsRepoMock.listPayments.mockResolvedValue([{ id: 'pay-1' }]);
    const res = buildRes();

    await adminHandler(
      {
        method: 'GET',
        headers: {},
        query: { path: ['payments'], status: 'approved,pending', method: 'pix' },
      } as unknown as VercelRequest,
      res,
    );

    expect(paymentsRepoMock.listPayments).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
      status: ['approved', 'pending'],
      paymentMethod: ['pix'],
    }));
    expect(res._state.status).toBe(200);
    expect(res._state.body).toMatchObject({
      payments: [{ id: 'pay-1' }],
      items: [{ id: 'pay-1' }],
      meta: { total: 1 },
    });
  });

  test('detalhe usa rota dedicada por id', async () => {
    paymentsRepoMock.getPaymentDetailById.mockResolvedValue({
      payment: { id: 'pay-1' },
      events: [],
      notes: [],
      recipes: [],
      entitlements: [],
    });
    const res = buildRes();

    await adminHandler(
      {
        method: 'GET',
        headers: {},
        query: { path: ['payments', 'pay-1'] },
      } as unknown as VercelRequest,
      res,
    );

    expect(paymentsRepoMock.getPaymentDetailById).toHaveBeenCalledWith('tenant-1', 'pay-1');
    expect(res._state.status).toBe(200);
    expect(res._state.body).toMatchObject({
      payment: { id: 'pay-1' },
      events: [],
      notes: [],
    });
  });

  test('salva nota interna no endpoint dedicado', async () => {
    paymentsRepoMock.getPaymentById.mockResolvedValue({ id: 'pay-1' });
    paymentsRepoMock.createPaymentNote.mockResolvedValue({
      id: 'note-1',
      payment_id: 'pay-1',
      note: 'Nota interna',
      created_by_user_id: 'admin-1',
      created_at: '2026-03-25T10:07:00.000Z',
      updated_at: '2026-03-25T10:07:00.000Z',
    });
    const res = buildRes();

    await adminHandler(
      {
        method: 'POST',
        headers: { 'user-agent': 'vitest', 'x-csrf-token': 'token' },
        query: { path: ['payments', 'pay-1', 'note'] },
        body: { note: 'Nota interna' },
      } as unknown as VercelRequest,
      res,
    );

    expect(csrfMock.requireCsrf).toHaveBeenCalled();
    expect(paymentsRepoMock.createPaymentNote).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        paymentId: 'pay-1',
        note: 'Nota interna',
        actorType: 'admin',
        actorId: 'admin-1',
      }),
    );
    expect(res._state.status).toBe(201);
    expect(res._state.body).toMatchObject({
      note: expect.objectContaining({ id: 'note-1', note: 'Nota interna' }),
    });
  });
});
