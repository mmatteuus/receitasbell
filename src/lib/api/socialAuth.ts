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
 */
export async function startSocialLogin(provider = "google") {
  const result = await jsonFetch<OAuthStartResponse>("/api/auth/social/start", {
    method: "POST",
    body: { provider },
  });
  return result.data;
}
