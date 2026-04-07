import { jsonFetch } from "./client";
import { getCurrentTenantSlug } from "@/lib/tenant";
import {
  persistAdminSessionEnvelope,
  type AdminSessionResponse,
} from "@/lib/api/adminSession";

export type InviteStatus = "valid" | "expired" | "invalid" | "used";

export type ValidateInviteResponse = {
  status: InviteStatus;
  email?: string;
  tenantName?: string;
  tenantSlug?: string;
  message?: string;
};

export type AcceptInviteResponse = {
  authenticated: boolean;
  session?: AdminSessionResponse;
  message?: string;
};

/**
 * Valida um token de convite para admin.
 * Retorna informações sobre o status do convite e detalhes do tenant.
 */
export async function validateInvite(token: string): Promise<ValidateInviteResponse> {
  return jsonFetch<ValidateInviteResponse>("/api/admin/invites/validate", {
    method: "GET",
    headers: {
      "x-invite-token": token,
    },
  });
}

/**
 * Aceita um convite definindo a senha inicial do admin.
 * Retorna a sessão autenticada se bem-sucedido.
 */
export async function acceptInvite(input: {
  token: string;
  password: string;
  passwordConfirm: string;
}): Promise<AcceptInviteResponse> {
  const result = await jsonFetch<AcceptInviteResponse>("/api/admin/invites/accept", {
    method: "POST",
    body: {
      token: input.token,
      password: input.password,
      passwordConfirm: input.passwordConfirm,
      tenantSlug: getCurrentTenantSlug(),
    },
  });

  if (result.session) {
    await persistAdminSessionEnvelope(result.session);
  }

  return result;
}

/**
 * Solicita um novo convite (para caso o anterior tenha expirado).
 */
export async function requestNewInvite(email: string, reason?: string): Promise<{ success: boolean; message: string }> {
  return jsonFetch<{ success: boolean; message: string }>("/api/admin/invites/request", {
    method: "POST",
    body: {
      email,
      reason,
    },
  });
}
