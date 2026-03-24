import { createHmac } from 'node:crypto';
import { expect, test } from '@playwright/test';
import {
  buildMercadoPagoWebhookManifest,
  verifyMercadoPagoWebhookSignature,
} from '../src/server/payments/mercadoPago';
import { mapTypedSettings } from '../src/server/sheets/settingsRepo';

test('mapTypedSettings preserva a seção gratin e sua visibilidade', async () => {
  const settings = mapTypedSettings({
    showGratinSection: 'false',
    homeSectionsOrder: JSON.stringify(['hero', 'gratin', 'newsletter']),
  });

  expect(settings.showGratinSection).toBe(false);
  expect(settings.homeSectionsOrder).toEqual(['hero', 'gratin', 'newsletter']);
});

test('verifyMercadoPagoWebhookSignature valida manifest com ts, request-id e payment id', async () => {
  const previousToken = process.env.MP_ACCESS_TOKEN;
  const previousSecret = process.env.MP_WEBHOOK_SECRET;

  process.env.MP_ACCESS_TOKEN = 'test-token';
  process.env.MP_WEBHOOK_SECRET = 'test-secret';

  try {
    const manifest = buildMercadoPagoWebhookManifest('123456', 'req-789', '1700000000');
    const validDigest = createHmac('sha256', 'test-secret').update(manifest).digest('hex');

    expect(
      verifyMercadoPagoWebhookSignature('123456', 'req-789', {
        ts: '1700000000',
        v1: validDigest,
      })
    ).toBe(true);

    expect(
      verifyMercadoPagoWebhookSignature('123456', 'req-789', {
        ts: '1700000000',
        v1: 'deadbeef',
      })
    ).toBe(false);
  } finally {
    if (previousToken === undefined) delete process.env.MP_ACCESS_TOKEN;
    else process.env.MP_ACCESS_TOKEN = previousToken;

    if (previousSecret === undefined) delete process.env.MP_WEBHOOK_SECRET;
    else process.env.MP_WEBHOOK_SECRET = previousSecret;
  }
});
