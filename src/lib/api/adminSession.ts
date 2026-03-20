import { jsonFetch } from "./client";

export type AdminSessionResponse = {
  authenticated: boolean;
  databaseConfigured: boolean;
  mode: "legacy" | "bootstrap" | "tenant";
  bootstrapRequired: boolean;
  legacyAdminAuthenticated: boolean;
  tenantResolved: boolean;
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
};

export async function getAdminSession() {
  return jsonFetch<AdminSessionResponse>("/api/admin/auth/session");
}

export async function loginAdmin(input: { email?: string; password: string }) {
  return jsonFetch<AdminSessionResponse>("/api/admin/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function bootstrapAdmin(input: {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminPassword: string;
  host?: string | null;
}) {
  return jsonFetch<AdminSessionResponse>("/api/admin/auth/bootstrap", {
    method: "POST",
    body: input,
  });
}

export async function logoutAdmin() {
  await jsonFetch<void>("/api/admin/auth/logout", {
    method: "POST",
  });
}
