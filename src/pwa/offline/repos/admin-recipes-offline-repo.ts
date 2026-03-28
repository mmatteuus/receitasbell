import { ApiClientError } from "@/lib/api/client";
import {
  createRecipe,
  getRecipeById,
  type RecipeMutationPayload,
  updateRecipe,
} from "@/lib/api/recipes";
import type { RecipeRecord } from "@/lib/recipes/types";
import { getCurrentTenantSlug } from "@/lib/tenant";
import { getOfflineDb } from "../db/open-db";
import { emitOfflineDataChanged } from "../events";
import { enqueueOutboxOperation } from "../outbox/enqueue";
import { getOutboxRecord } from "../outbox/outbox-store";
import { createConflict } from "../sync/conflict-resolver";

export async function saveAdminRecipeDraftLocal(input: {
  draftId?: string | null;
  tenantSlug?: string | null;
  serverRecipeId?: string | null;
  payload: Record<string, unknown>;
  baseServerUpdatedAt?: string | null;
}) {
  const db = await getOfflineDb();
  const tenantSlug = input.tenantSlug || getCurrentTenantSlug() || "default";
  const draftId = input.draftId || input.serverRecipeId || crypto.randomUUID();
  const updatedAt = new Date().toISOString();
  const opId = crypto.randomUUID();

  await db.put("admin_recipe_drafts", {
    draftId,
    serverRecipeId: input.serverRecipeId || null,
    tenantSlug,
    payload: input.payload,
    baseServerUpdatedAt: input.baseServerUpdatedAt || null,
    updatedAt,
    syncState: "pending",
    errorMessage: null,
  }, draftId);

  await enqueueOutboxOperation({
    opId,
    entity: "admin_recipe_draft",
    action: "upsert",
    baseVersion: input.baseServerUpdatedAt || null,
    payload: {
      draftId,
      tenantSlug,
      serverRecipeId: input.serverRecipeId || null,
      recipe: input.payload,
    },
  });

  emitOfflineDataChanged("admin_recipe_drafts");
  return { draftId, updatedAt };
}

export async function getAdminRecipeDraft(serverRecipeId: string) {
  const db = await getOfflineDb();
  const drafts = await db.getAllFromIndex("admin_recipe_drafts", "by_serverRecipeId", serverRecipeId);
  return drafts[0] || null;
}

export async function getAdminRecipeDraftById(draftId: string) {
  const db = await getOfflineDb();
  return db.get("admin_recipe_drafts", draftId);
}

export async function listAdminRecipeDrafts(tenantSlug?: string | null) {
  const db = await getOfflineDb();
  const resolvedTenantSlug = tenantSlug || getCurrentTenantSlug() || "default";
  return db.getAllFromIndex("admin_recipe_drafts", "by_tenantSlug", resolvedTenantSlug);
}

export async function replayAdminRecipeDraftOperation(opId: string, action: string) {
  if (action !== "upsert") {
    throw new Error(`Unsupported admin draft action: ${action}`);
  }

  const outboxRecord = await getOutboxRecord(opId);
  if (!outboxRecord) {
    return;
  }

  const draftId = String(outboxRecord.payload.draftId || "");
  const serverRecipeId = outboxRecord.payload.serverRecipeId
    ? String(outboxRecord.payload.serverRecipeId)
    : null;
  const recipePayload = outboxRecord.payload.recipe as Record<string, unknown> | undefined;

  if (!draftId || !recipePayload) {
    throw new Error("Admin draft payload is incomplete.");
  }
  const mutationPayload = recipePayload as RecipeMutationPayload;

  const db = await getOfflineDb();
  const draft = await db.get("admin_recipe_drafts", draftId);
  if (!draft) {
    return;
  }

  try {
    let serverRecipe: RecipeRecord;
    if (serverRecipeId) {
      serverRecipe = await updateRecipe(serverRecipeId, {
        ...mutationPayload,
        baseServerUpdatedAt: outboxRecord.baseVersion || draft.baseServerUpdatedAt || null,
      });
    } else {
      serverRecipe = await createRecipe(mutationPayload);
    }

    await db.put("admin_recipe_drafts", {
      ...draft,
      serverRecipeId: serverRecipe.id,
      baseServerUpdatedAt: serverRecipe.updatedAt,
      updatedAt: new Date().toISOString(),
      syncState: "synced",
      errorMessage: null,
    }, draftId);
    emitOfflineDataChanged("admin_recipe_drafts");
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 409) {
      await createConflict({
        conflictId: `admin-recipe:${draftId}`,
        entity: "admin_recipe_draft",
        localPayload: {
          draftId,
          recipe: recipePayload,
        },
        serverPayload: (error.details as { server?: Record<string, unknown> } | undefined)?.server || {},
      });

      await db.put("admin_recipe_drafts", {
        ...draft,
        syncState: "conflict",
        errorMessage: error.message,
      }, draftId);
      emitOfflineDataChanged("admin_recipe_drafts");
      throw error;
    }

    await db.put("admin_recipe_drafts", {
      ...draft,
      syncState: "failed",
      errorMessage: error instanceof Error ? error.message : "Não foi possível sincronizar o rascunho.",
    }, draftId);
    emitOfflineDataChanged("admin_recipe_drafts");
    throw error;
  }
}

export async function loadAdminRecipeForEditor(id: string) {
  const offlineDraft = await getAdminRecipeDraftById(id) || await getAdminRecipeDraft(id);
  if (offlineDraft) {
    return {
      ...(offlineDraft.payload as Partial<RecipeRecord>),
      draftId: offlineDraft.draftId,
      serverRecipeId: offlineDraft.serverRecipeId || null,
    };
  }

  return getRecipeById(id);
}
