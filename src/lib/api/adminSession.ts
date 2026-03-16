import { jsonFetch } from "./client";

type AdminSessionResponse = {
  authenticated: boolean;
};

export async function getAdminSession() {
  return jsonFetch<AdminSessionResponse>("/api/admin/session");
}

export async function loginAdmin(password: string) {
  return jsonFetch<AdminSessionResponse>("/api/admin/session", {
    method: "POST",
    body: { password },
  });
}

export async function logoutAdmin() {
  await jsonFetch<void>("/api/admin/session", {
    method: "DELETE",
  });
}
