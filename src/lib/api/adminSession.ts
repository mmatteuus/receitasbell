import { jsonFetch } from "./client";
import {
  clearOfflineSession,
  getOfflineAdminSession,
  persistAdminSessionEnvelope,
} from "@/pwa/offline/auth/offline-auth";

export type AdminSessionResponse = {
  authenticated: boolean;
  mode: "bootstrap" | "tenant";
  bootstrapRequired: boolean;
  tenant: {
    id: string;
    slug: string;
    name: string;
  } | null;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  offlineRestricted?: boolean;
  lastValidatedAt?: string;
  expiresAt?: string;
};

export async function getAdminSession(
  options: { allowOffline?: boolean } = {},
): Promise<AdminSessionResponse> {
  try {
    const result = await jsonFetch<AdminSessionResponse>("/api/admin/auth/session");
    if (result.authenticated) {
      await persistAdminSessionEnvelope(result);
    }
    return result;
  } catch (error) {
    if (!options.allowOffline) {
      throw error;
    }

    const offlineSession = await getOfflineAdminSession();
    if (offlineSession) {
      return offlineSession;
    }

    return {
      authenticated: false,
      mode: "tenant",
      bootstrapRequired: false,
      tenant: null,
      user: null,
    };
  }
}

export async function loginAdmin(
  input: { email?: string; password?: string },
): Promise<AdminSessionResponse> {
  const result = await jsonFetch<AdminSessionResponse>("/api/admin/auth/session", {
    method: "POST",
    body: input,
  });
  if (result.authenticated) {
    await persistAdminSessionEnvelope(result);
  }
  return result;
}

export async function bootstrapAdmin(input: {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminPassword: string;
  host?: string | null;
}): Promise<AdminSessionResponse> {
  return jsonFetch<AdminSessionResponse>("/api/admin/auth/bootstrap", {
    method: "POST",
    body: input,
  });
}

export async function logoutAdmin() {
  try {
    await jsonFetch<void>("/api/admin/auth/session", {
      method: "DELETE",
    });
  } finally {
    await clearOfflineSession("admin");
  }
}
