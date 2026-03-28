import { beforeEach, describe, expect, test, vi } from 'vitest';

const baserowFetch = vi.hoisted(() => vi.fn());
const BaserowErrorMock = vi.hoisted(() => class BaserowError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'BaserowError';
    this.status = status;
    this.body = body;
  }
});
const recipesMock = vi.hoisted(() => ({
  listRecipes: vi.fn(),
}));
const entitlementsMock = vi.hoisted(() => ({
  listEntitlementsByEmail: vi.fn(),
}));

vi.mock('../src/server/integrations/baserow/client.js', () => ({
  baserowFetch,
  BaserowError: BaserowErrorMock,
}));
vi.mock('../src/server/integrations/baserow/tables.js', () => ({
  baserowTables: {
    paymentOrders: 'paymentOrders',
    paymentEvents: 'paymentEvents',
    auditLogs: 'auditLogs',
  },
}));
vi.mock('../src/server/recipes/repo.js', () => ({
  listRecipes: (...args: unknown[]) => recipesMock.listRecipes(...args),
}));
vi.mock('../src/server/identity/entitlements.repo.js', () => ({
  listEntitlementsByEmail: (...args: unknown[]) => entitlementsMock.listEntitlementsByEmail(...args),
}));

import { createPaymentNote, getPaymentDetailById, listPayments } from '../src/server/payments/repo.js';

describe('admin payments repo', () => {
  beforeEach(() => {
    baserowFetch.mockReset();
    recipesMock.listRecipes.mockReset();
    entitlementsMock.listEntitlementsByEmail.mockReset();
  });

  test('lista pagamentos com filtro e enriquece itens com slug da receita', async () => {
    baserowFetch.mockResolvedValue({
      results: [
        {
          id: 'pay-1',
          tenant_id: 'tenant-1',
          amount: 29.9,
          status: 'approved',
          external_reference: 'checkout-1',
          mp_payment_id: 'mp-1',
          payer_email: 'cliente@example.com',
          payment_method: 'mercadopago',
          provider: 'mercadopago',
          recipe_ids_json: JSON.stringify(['recipe-1']),
          items_json: JSON.stringify([{ recipeId: 'recipe-1', title: 'Bolo de Cenoura', priceBRL: 29.9 }]),
          created_at: '2026-03-25T10:00:00.000Z',
          updated_at: '2026-03-25T10:05:00.000Z',
        },
        {
          id: 'pay-2',
          tenant_id: 'tenant-1',
          amount: 19.9,
          status: 'pending',
          external_reference: 'checkout-2',
          payer_email: 'outro@example.com',
          payment_method: 'pix',
          provider: 'mercadopago',
          recipe_ids_json: JSON.stringify(['recipe-2']),
          items_json: JSON.stringify([{ recipeId: 'recipe-2', title: 'Torta', priceBRL: 19.9 }]),
          created_at: '2026-03-25T09:00:00.000Z',
          updated_at: '2026-03-25T09:01:00.000Z',
        },
      ],
      next: null,
    });
    recipesMock.listRecipes.mockResolvedValue([
      {
        id: 'recipe-1',
        slug: 'bolo-de-cenoura',
        title: 'Bolo de Cenoura',
        imageUrl: 'https://cdn.example.com/bolo.jpg',
        priceBRL: 29.9,
      },
      {
        id: 'recipe-2',
        slug: 'torta-de-limao',
        title: 'Torta',
        imageUrl: null,
        priceBRL: 19.9,
      },
    ]);

    const payments = await listPayments('tenant-1', {
      status: ['approved'],
      email: 'cliente@',
    });

    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      id: 'pay-1',
      status: 'approved',
      paymentMethodKey: 'pending',
      checkoutReference: 'checkout-1',
    });
    expect(payments[0]?.items[0]).toMatchObject({
      recipeId: 'recipe-1',
      slug: 'bolo-de-cenoura',
      imageUrl: 'https://cdn.example.com/bolo.jpg',
    });
  });

  test('monta detalhe com eventos, notas e entitlements relacionados', async () => {
    baserowFetch.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path.includes('/paymentOrders/pay-1/')) {
        return {
          id: 'pay-1',
          tenant_id: 'tenant-1',
          amount: 29.9,
          status: 'approved',
          external_reference: 'checkout-1',
          mp_payment_id: 'mp-1',
          payer_email: 'cliente@example.com',
          payment_method: 'pix',
          provider: 'mercadopago',
          recipe_ids_json: JSON.stringify(['recipe-1']),
          items_json: JSON.stringify([{ recipeId: 'recipe-1', title: 'Bolo de Cenoura', priceBRL: 29.9 }]),
          created_at: '2026-03-25T10:00:00.000Z',
          updated_at: '2026-03-25T10:05:00.000Z',
        };
      }
      if (path.includes('paymentEvents')) {
        return {
          results: [
            {
              id: 'evt-1',
              mp_payment_id: 'mp-1',
              event_data_id: '12345',
              raw_json: JSON.stringify({ action: 'payment.updated', data: { id: 'mp-1' } }),
              created_at: '2026-03-25T10:04:00.000Z',
            },
          ],
          next: null,
        };
      }
      if (path.includes('auditLogs')) {
        if (init?.method === 'POST') {
          return {
            id: 'note-2',
            actor_type: 'admin',
            actor_id: 'admin-1',
            resource_id: 'pay-1',
            payload: JSON.stringify({ note: 'Nova nota' }),
            created_at: '2026-03-25T10:07:00.000Z',
          };
        }
        return {
          results: [
            {
              id: 'note-1',
              actor_type: 'admin',
              actor_id: 'admin-1',
              action: 'payment.note_added',
              resource_id: 'pay-1',
              payload: JSON.stringify({ note: 'Nota existente' }),
              created_at: '2026-03-25T10:06:00.000Z',
            },
          ],
          next: null,
        };
      }
      throw new Error(`unexpected path ${path}`);
    });
    recipesMock.listRecipes.mockResolvedValue([
      {
        id: 'recipe-1',
        slug: 'bolo-de-cenoura',
        title: 'Bolo de Cenoura',
        imageUrl: 'https://cdn.example.com/bolo.jpg',
        priceBRL: 29.9,
      },
    ]);
    entitlementsMock.listEntitlementsByEmail.mockResolvedValue([
      {
        id: 'ent-1',
        paymentId: 'pay-1',
        payerEmail: 'cliente@example.com',
        recipeSlug: 'bolo-de-cenoura',
        accessStatus: 'active',
        createdAt: '2026-03-25T10:05:00.000Z',
        updatedAt: '2026-03-25T10:05:00.000Z',
      },
      {
        id: 'ent-2',
        paymentId: 'pay-2',
        payerEmail: 'cliente@example.com',
        recipeSlug: 'outra-receita',
        accessStatus: 'active',
        createdAt: '2026-03-25T10:05:00.000Z',
        updatedAt: '2026-03-25T10:05:00.000Z',
      },
    ]);

    const detail = await getPaymentDetailById('tenant-1', 'pay-1');
    expect(detail).not.toBeNull();
    expect(detail?.payment).toMatchObject({
      id: 'pay-1',
      webhookReceivedAt: '2026-03-25T10:04:00.000Z',
      paymentMethodKey: 'pix',
    });
    expect(detail?.events).toEqual([
      expect.objectContaining({
        id: 'evt-1',
        type: 'payment.updated',
      }),
    ]);
    expect(detail?.notes).toEqual([
      expect.objectContaining({
        id: 'note-1',
        note: 'Nota existente',
        created_by_user_id: 'admin-1',
      }),
    ]);
    expect(detail?.entitlements).toEqual([
      expect.objectContaining({
        id: 'ent-1',
        paymentId: 'pay-1',
      }),
    ]);
  });

  test('cria nota interna e devolve payload normalizado', async () => {
    baserowFetch.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path.includes('/paymentOrders/pay-1/')) {
        return {
          id: 'pay-1',
          tenant_id: 'tenant-1',
          amount: 29.9,
          status: 'approved',
          payer_email: 'cliente@example.com',
          payment_method: 'pix',
          provider: 'mercadopago',
          recipe_ids_json: '[]',
          items_json: '[]',
          created_at: '2026-03-25T10:00:00.000Z',
          updated_at: '2026-03-25T10:05:00.000Z',
        };
      }
      if (path.includes('auditLogs') && init?.method === 'POST') {
        return {
          id: 'note-2',
          actor_type: 'admin',
          actor_id: 'admin-1',
          resource_id: 'pay-1',
          payload: JSON.stringify({ note: 'Nova nota' }),
          created_at: '2026-03-25T10:07:00.000Z',
        };
      }
      throw new Error(`unexpected path ${path}`);
    });

    const note = await createPaymentNote({
      tenantId: 'tenant-1',
      paymentId: 'pay-1',
      note: 'Nova nota',
      actorType: 'admin',
      actorId: 'admin-1',
      ip: '127.0.0.1',
      userAgent: 'vitest',
    });

    expect(note).toEqual({
      id: 'note-2',
      payment_id: 'pay-1',
      note: 'Nova nota',
      created_by_user_id: 'admin-1',
      created_at: '2026-03-25T10:07:00.000Z',
      updated_at: '2026-03-25T10:07:00.000Z',
    });
  });

  test('explicita erro de configuracao quando a tabela de payment orders nao existe', async () => {
    baserowFetch.mockRejectedValue(
      new BaserowErrorMock(404, 'Baserow HTTP 404', { error: 'ERROR_TABLE_DOES_NOT_EXIST' }),
    );

    await expect(listPayments('tenant-1')).rejects.toMatchObject({
      status: 503,
      details: expect.objectContaining({
        code: 'payments_storage_not_configured',
        tableEnv: 'BASEROW_TABLE_PAYMENT_ORDERS',
      }),
    });
  });
});
