const MP_FETCH_TIMEOUT_MS = 10_000;
const MP_MAX_RETRIES = 2;

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

/** Represents a single payment method entry from /v1/payment_methods. */
export type MercadoPagoPaymentMethod = {
  id?: string;
  name?: string;
  payment_type_id?: string;
  status?: string;
  secure_thumbnail?: string;
  thumbnail?: string;
  deferred_capture?: string;
  min_allowed_amount?: number;
  max_allowed_amount?: number;
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
  return { Authorization: `Bearer ${accessToken}` };
}

async function parseJsonSafe(response: Response): Promise<MercadoPagoErrorPayload> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (response.json() as Promise<any>);
    if (data !== null && typeof data === "object" && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

async function mpFetch(
  url: string,
  init: RequestInit = {},
  retries = MP_MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MP_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        const delay = 300 * Math.pow(2, attempt) + Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error: unknown) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      if (isAbort && attempt < retries) {
        const delay = 300 * Math.pow(2, attempt) + Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (isAbort) {
        throw new MercadoPagoApiError(
          408,
          `MP request timeout after ${MP_FETCH_TIMEOUT_MS}ms: ${url}`,
          null,
        );
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new MercadoPagoApiError(500, "mpFetch: exit inesperado do loop de retry", null);
}

export async function mpGetPayment(accessToken: string, paymentId: string): Promise<MercadoPagoPayment> {
  const response = await mpFetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: authHeaders(accessToken) },
  );
  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(response.status, `MP get payment failed ${response.status}`, payload);
  }
  return (payload ?? {}) as MercadoPagoPayment;
}

export async function mpSearchPaymentsByExternalReference(
  accessToken: string,
  externalReference: string,
): Promise<MercadoPagoSearchResponse> {
  const url = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(externalReference)}`;
  const response = await mpFetch(url, { headers: authHeaders(accessToken) });
  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(response.status, `MP search payments failed ${response.status}`, payload);
  }
  return (payload ?? {}) as MercadoPagoSearchResponse;
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

  const response = await mpFetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(response.status, `MP preference failed ${response.status}`, body);
  }
  return (body ?? {}) as MercadoPagoPreference;
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

  const response = await mpFetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(response.status, `MP payment create failed ${response.status}`, body);
  }
  return (body ?? {}) as MercadoPagoPayment;
}

export async function cancelMercadoPagoPayment(
  accessToken: string,
  paymentId: string,
): Promise<MercadoPagoPayment> {
  const response = await mpFetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: "PUT",
      headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    },
  );

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new MercadoPagoApiError(response.status, `MP payment cancel failed ${response.status}`, body);
  }
  return (body ?? {}) as MercadoPagoPayment;
}

/**
 * Fetches the list of available payment methods for the given seller account.
 * Used by methods.ts to build a SellerPaymentMethodSnapshot.
 * Endpoint: GET /v1/payment_methods
 */
export async function mpFetchPaymentMethods(
  accessToken: string,
): Promise<MercadoPagoPaymentMethod[]> {
  const response = await mpFetch(
    "https://api.mercadopago.com/v1/payment_methods",
    { headers: authHeaders(accessToken) },
    1, // single retry for this auxiliary call
  );
  if (!response.ok) {
    const payload = await parseJsonSafe(response);
    throw new MercadoPagoApiError(
      response.status,
      `MP payment_methods failed ${response.status}`,
      payload,
    );
  }
  // The endpoint returns a plain array, not an object with results
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (response.json() as Promise<any>);
    return Array.isArray(data) ? (data as MercadoPagoPaymentMethod[]) : [];
  } catch {
    return [];
  }
}
