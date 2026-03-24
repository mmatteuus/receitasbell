import { ApiError } from "../../shared/http.js";
import { getUsableMercadoPagoAccessToken } from "./connections.js";
import { Logger } from "../../shared/logger.js";

const logger = new Logger({ integration: "mercadopago" });
const MAX_RETRIES = 3;
const TIMEOUT_MS = 15000;

async function fetchMP<T>(
  tenantId: string | number, 
  endpoint: string, 
  options: RequestInit = {}, 
  idempotencyKey?: string
): Promise<T> {
  const { accessToken } = await getUsableMercadoPagoAccessToken(String(tenantId));
  const url = `https://api.mercadopago.com${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (idempotencyKey) {
    headers.set("X-Idempotency-Key", idempotencyKey);
  }
  
  if (options.method && options.method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let lastError: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unknown error" }));
        if (attempt < MAX_RETRIES && (response.status >= 500 || response.status === 429)) {
          logger.warn(`Mercado Pago temporary error (${response.status}). Attempt ${attempt}/${MAX_RETRIES}`, { endpoint, idempotencyKey });
          continue;
        }
        logger.error(`Mercado Pago API Error: ${response.status} ${endpoint}`, { body, idempotencyKey });
        throw new ApiError(502, "Mercado Pago API failure", body);
      }

      return await response.json() as T;
    } catch (error: any) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < MAX_RETRIES) {
        logger.warn(`Mercado Pago attempt ${attempt} failed: ${error.message}. Retrying...`, { endpoint, idempotencyKey });
        continue;
      }
    }
  }

  throw new ApiError(502, `Mercado Pago total failure: ${lastError.message}`);
}

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  [key: string]: unknown;
};

export async function createMercadoPagoPreference(tenantId: string | number, input: {
  items: any[];
  external_reference: string;
  payer: { email: string; name?: string };
  back_urls: { success: string; pending: string; failure: string };
  notification_url?: string;
  idempotencyKey?: string;
}) {
  return fetchMP<MercadoPagoPreferenceResponse>(tenantId, "/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: input.items,
      external_reference: input.external_reference,
      payer: input.payer,
      auto_return: "approved",
      back_urls: input.back_urls,
      notification_url: input.notification_url,
    }),
  }, input.idempotencyKey);
}

export async function fetchMercadoPagoPayment(tenantId: string | number, paymentId: string) {
  return fetchMP<Record<string, unknown>>(tenantId, `/v1/payments/${encodeURIComponent(paymentId)}`);
}
