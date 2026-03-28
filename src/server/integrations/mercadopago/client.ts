type MercadoPagoErrorPayload = Record<string, unknown> | null;

export type MercadoPagoPayment = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  [key: string]: unknown;
};

export type MercadoPagoSearchResponse = {
  results?: MercadoPagoPayment[];
  [key: string]: unknown;
};

export type MercadoPagoPreference = {
  id?: string | number;
  init_point?: string;
  sandbox_init_point?: string;
  [key: string]: unknown;
};

export class MercadoPagoApiError extends Error {
  status: number;
  payload: MercadoPagoErrorPayload;

  constructor(status: number, message: string, payload: MercadoPagoErrorPayload) {
    super(message);
    this.name = "MercadoPagoApiError";
    this.status = status;
    this.payload = payload;
  }
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => null) as Promise<MercadoPagoErrorPayload>;
}

export async function mpGetPayment(accessToken: string, paymentId: string): Promise<MercadoPagoPayment> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: authHeaders(accessToken),
  });
  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(response.status, `MP get payment failed ${response.status}`, payload);
  }
  return payload as MercadoPagoPayment;
}

export async function mpSearchPaymentsByExternalReference(
  accessToken: string,
  externalReference: string,
): Promise<MercadoPagoSearchResponse> {
  const url = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(externalReference)}`;
  const response = await fetch(url, {
    headers: authHeaders(accessToken),
  });
  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(response.status, `MP search payments failed ${response.status}`, payload);
  }
  return payload as MercadoPagoSearchResponse;
}

export async function createMercadoPagoPreference(
  accessToken: string,
  input: Record<string, unknown> & { idempotencyKey?: string },
): Promise<MercadoPagoPreference> {
  const { idempotencyKey, ...payload } = input;
  const headers: Record<string, string> = {
    ...authHeaders(accessToken),
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = String(idempotencyKey);

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(
      response.status,
      `MP preference failed ${response.status}`,
      body,
    );
  }

  return body as MercadoPagoPreference;
}

export async function createMercadoPagoPayment(
  accessToken: string,
  input: Record<string, unknown> & { idempotencyKey?: string },
): Promise<MercadoPagoPayment> {
  const { idempotencyKey, ...payload } = input;
  const headers: Record<string, string> = {
    ...authHeaders(accessToken),
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = String(idempotencyKey);

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(
      response.status,
      `MP payment create failed ${response.status}`,
      body,
    );
  }

  return body as MercadoPagoPayment;
}

export async function cancelMercadoPagoPayment(
  accessToken: string,
  paymentId: string,
): Promise<MercadoPagoPayment> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "PUT",
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(
      response.status,
      `MP payment cancel failed ${response.status}`,
      body,
    );
  }

  return body as MercadoPagoPayment;
}
