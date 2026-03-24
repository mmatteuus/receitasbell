import { env } from "../../shared/env.js";

export async function mpGetPayment(paymentId: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`MP get payment failed ${res.status}`);
  return res.json();
}

export async function mpSearchPaymentsByExternalReference(externalReference: string) {
  const url = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(externalReference)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` } });
  if (!res.ok) throw new Error(`MP search payments failed ${res.status}`);
  return res.json();
}
