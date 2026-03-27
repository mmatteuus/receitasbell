import { jsonFetch } from "./client";

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
};

export async function getAdminSession() {
  return jsonFetch<AdminSessionResponse>("/api/admin/auth/session");
}

export async function loginAdmin(input: { email?: string; password?: string }) {
  return jsonFetch<AdminSessionResponse>("/api/admin/auth/session", {
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
  await jsonFetch<void>("/api/admin/auth/session", {
    method: "DELETE",
  });
}
