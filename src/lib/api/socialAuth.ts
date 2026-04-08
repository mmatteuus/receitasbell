import { jsonFetch } from "./client";

export type OAuthStartResponse = {
  success: boolean;
  data: {
    authorizationUrl: string;
    state: string;
  };
};

/**
 * Inicia o fluxo de autenticação social (Google).
 * Retorna a URL para redirecionar o usuário.
 * O tenantId é resolvido automaticamente pelo servidor via Host header.
 */
export async function startSocialLogin(provider = "google", redirectTo?: string) {
  const result = await jsonFetch<OAuthStartResponse>("/api/auth/oauth/start", {
    method: "POST",
    body: { provider, redirectTo },
  });
  return result.data;
}
