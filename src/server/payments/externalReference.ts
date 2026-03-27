export function buildPaymentExternalReference(tenantId: string | number, paymentOrderId: string | number) {
  return `t:${tenantId}:p:${paymentOrderId}`;
}

export function parsePaymentExternalReference(value: string | null | undefined) {
  if (!value) return null;
  const match = /^t:([^:]+):p:([^:]+)$/.exec(value.trim());
  if (!match) return null;
  const tenantId = match[1];
  const paymentOrderId = match[2];
  if (!tenantId || !paymentOrderId) return null;
  return { tenantId, paymentOrderId };
}
