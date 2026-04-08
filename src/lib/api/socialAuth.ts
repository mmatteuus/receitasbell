import { jsonFetch } from "./client";

export type OAuthStartResponse = {
  success: boolean;
  data: {
    authorizationUrl: string;
  };
};

type StartSocialLoginOptions =
  | string
  | {
      redirectTo?: string;
      tenantSlug?: string;
    };

function normalizeOptions(options?: StartSocialLoginOptions) {
  if (typeof options === "string") {
    return { redirectTo: options };
  }
  return options ?? {};
}

/**
 * Inicia o fluxo de autenticação social (Google).
 * Retorna a URL para redirecionar o usuário.
 * O tenant é resolvido no servidor por header/host, com suporte a tenantSlug no payload.
 */
export async function startSocialLogin(provider = "google", options?: StartSocialLoginOptions) {
  const { redirectTo, tenantSlug } = normalizeOptions(options);
  const body: { provider: string; redirectTo?: string; tenantSlug?: string } = { provider };
  if (redirectTo) body.redirectTo = redirectTo;
  if (tenantSlug) body.tenantSlug = tenantSlug;

  const result = await jsonFetch<OAuthStartResponse>("/api/auth/oauth/start", {
    method: "POST",
    body,
  });
  return result.data;
}
