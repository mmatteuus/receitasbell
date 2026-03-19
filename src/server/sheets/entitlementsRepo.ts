import type { Entitlement } from "../../types/entitlement.js";
import { mutateTable, readTable } from "./table.js";
import { readTable as readLegacyTable } from "./table.js";
import { nowIso } from "./utils.js";

function mapEntitlement(row: {
  id: string;
  paymentId: string;
  payerEmail: string;
  recipeSlug: string;
  accessStatus: string;
  createdAt: string;
  updatedAt: string;
}): Entitlement {
  return {
    id: row.id,
    paymentId: row.paymentId,
    payerEmail: row.payerEmail.trim().toLowerCase(),
    recipeSlug: row.recipeSlug,
    accessStatus: row.accessStatus === "revoked" ? "revoked" : "active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function backfillLegacyUnlocks(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return [];
  }

  const [legacyUnlocks, recipeRows, currentEntitlements] = await Promise.all([
    readLegacyTable("recipe_unlocks"),
    readLegacyTable("recipes"),
    readTable("entitlements"),
  ]);

  const recipeSlugById = new Map(recipeRows.map((recipe) => [recipe.id, recipe.slug]));
  const legacyMatches = legacyUnlocks.filter(
    (row) => row.buyer_email.trim().toLowerCase() === normalizedEmail,
  );

  const createdAt = nowIso();
  const missingRows = legacyMatches
    .map((unlock) => ({
      id: crypto.randomUUID(),
      paymentId: unlock.payment_id,
      payerEmail: normalizedEmail,
      recipeSlug: recipeSlugById.get(unlock.recipe_id) || "",
      accessStatus: "active",
      createdAt: unlock.unlocked_at || createdAt,
      updatedAt: unlock.unlocked_at || createdAt,
    }))
    .filter(
      (row) =>
        row.recipeSlug &&
        !currentEntitlements.some(
          (entitlement) =>
            entitlement.payerEmail.trim().toLowerCase() === normalizedEmail &&
            entitlement.recipeSlug === row.recipeSlug,
        ),
    );

  if (!missingRows.length) {
    return currentEntitlements
      .filter((row) => row.payerEmail.trim().toLowerCase() === normalizedEmail)
      .map(mapEntitlement);
  }

  const nextRows = await mutateTable("entitlements", async (rows) => [...rows, ...missingRows]);
  return nextRows
    .filter((row) => row.payerEmail.trim().toLowerCase() === normalizedEmail)
    .map(mapEntitlement);
}

export async function listEntitlementsByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return [];
  }

  const rows = await readTable("entitlements");
  const entitlements = rows
    .filter((row) => row.payerEmail.trim().toLowerCase() === normalizedEmail)
    .map(mapEntitlement);

  if (entitlements.length > 0) {
    return entitlements;
  }

  return backfillLegacyUnlocks(normalizedEmail);
}

export async function hasActiveEntitlement(email: string, recipeSlug: string) {
  const entitlements = await listEntitlementsByEmail(email);
  return entitlements.some(
    (entitlement) =>
      entitlement.recipeSlug === recipeSlug && entitlement.accessStatus === "active",
  );
}

export async function createEntitlement(input: {
  paymentId: string;
  payerEmail: string;
  recipeSlug: string;
}) {
  const payerEmail = input.payerEmail.trim().toLowerCase();
  const now = nowIso();
  const rows = await mutateTable("entitlements", async (current) => {
    const existing = current.find(
      (row) =>
        row.payerEmail.trim().toLowerCase() === payerEmail &&
        row.recipeSlug === input.recipeSlug,
    );

    if (existing) {
      return current.map((row) =>
        row.id !== existing.id
          ? row
          : {
              ...row,
              paymentId: input.paymentId,
              accessStatus: "active",
              updatedAt: now,
            },
      );
    }

    return [
      ...current,
      {
        id: crypto.randomUUID(),
        paymentId: input.paymentId,
        payerEmail,
        recipeSlug: input.recipeSlug,
        accessStatus: "active",
        createdAt: now,
        updatedAt: now,
      },
    ];
  });

  const created =
    rows.find(
      (row) =>
        row.payerEmail.trim().toLowerCase() === payerEmail &&
        row.recipeSlug === input.recipeSlug,
    ) ?? null;

  return created ? mapEntitlement(created) : null;
}

export async function revokeEntitlement(paymentId: string, recipeSlug?: string) {
  const now = nowIso();
  const rows = await mutateTable("entitlements", async (current) =>
    current.map((row) => {
      if (row.paymentId !== paymentId) {
        return row;
      }

      if (recipeSlug && row.recipeSlug !== recipeSlug) {
        return row;
      }

      return {
        ...row,
        accessStatus: "revoked",
        updatedAt: now,
      };
    }),
  );

  return rows
    .filter(
      (row) => row.paymentId === paymentId && (!recipeSlug || row.recipeSlug === recipeSlug),
    )
    .map(mapEntitlement);
}
