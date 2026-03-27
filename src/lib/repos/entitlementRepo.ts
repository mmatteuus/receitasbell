import type { Entitlement } from "@/types/entitlement";
import { jsonFetch } from "@/lib/api/client";

export async function listByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return [];
  }

  const result = await jsonFetch<{ entitlements: Entitlement[] }>("/api/me/entitlements");
  return result.entitlements;
}

export async function exists(email: string, recipeSlug: string) {
  const entitlements = await listByEmail(email);
  return entitlements.some(
    (entitlement) =>
      entitlement.recipeSlug === recipeSlug && entitlement.accessStatus === "active",
  );
}

export async function create(
  entitlement: Pick<Entitlement, "paymentId" | "payerEmail" | "recipeSlug">,
) {
  const result = await jsonFetch<{ entitlement: Entitlement | null }>("/api/admin/entitlements", {
    method: "POST",
    admin: true,
    body: entitlement,
  });

  return result.entitlement;
}

export async function revoke(paymentId: string, recipeSlug: string) {
  const result = await jsonFetch<{ success: boolean }>("/api/admin/entitlements", {
    method: "DELETE",
    admin: true,
    body: { paymentId, recipeSlug },
  });

  return result.success;
}

export const entitlementRepo = {
  listByEmail,
  exists,
  create,
  revoke,
};
