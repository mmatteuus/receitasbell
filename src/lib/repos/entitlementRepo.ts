import type { Entitlement } from "@/types/entitlement";
import { jsonFetch } from "@/lib/api/client";

export async function listByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return [];
  }

  const result = await jsonFetch<{ entitlements: Entitlement[] }>("/api/entitlements");
  return result.entitlements.filter(
    (entitlement) => entitlement.payerEmail.trim().toLowerCase() === normalizedEmail,
  );
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
  const result = await jsonFetch<{ entitlement: Entitlement | null }>("/api/entitlements", {
    method: "POST",
    admin: true,
    body: entitlement,
  });

  return result.entitlement;
}

export async function revoke(paymentId: string, recipeSlug: string) {
  const result = await jsonFetch<{ entitlements: Entitlement[] }>("/api/entitlements", {
    method: "DELETE",
    admin: true,
    body: { paymentId, recipeSlug },
  });

  return result.entitlements;
}

export const entitlementRepo = {
  listByEmail,
  exists,
  create,
  revoke,
};
