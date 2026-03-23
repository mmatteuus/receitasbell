import { ApiError } from "../../shared/http.js";
import { getUsableMercadoPagoAccessToken } from "./connections.js";

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
}) {
  const { accessToken } = await getUsableMercadoPagoAccessToken(String(tenantId));
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: input.items,
      external_reference: input.external_reference,
      payer: input.payer,
      auto_return: "approved",
      back_urls: input.back_urls,
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new ApiError(502, "Mercado Pago preference creation failed", body);
  return body as MercadoPagoPreferenceResponse;
}

export async function fetchMercadoPagoPayment(tenantId: string | number, paymentId: string) {
  const { accessToken } = await getUsableMercadoPagoAccessToken(String(tenantId));
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!response.ok) throw new ApiError(502, `MP lookup failed: ${response.status}`);
  return (await response.json()) as Record<string, unknown>;
}
