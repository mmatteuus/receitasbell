import { ApiError } from "../http.js";
import { SheetRecord } from "./schema.js";
import { mutateTable, readTable } from "./table.js";
import { asNumber, nowIso } from "./utils.js";

export interface RecipeRatingSummary {
  avg: number;
  count: number;
  userValue: number | null;
}

function buildSummary(
  rows: SheetRecord<"ratings">[],
  recipeId: string,
  identity: { userId?: string | null; email?: string | null },
): RecipeRatingSummary {
  const recipeRows = rows.filter((row) => row.recipe_id === recipeId);
  const values = recipeRows.map((row) => asNumber(row.value)).filter((value) => value > 0);
  const match = recipeRows.find((row) => {
    if (identity.userId) {
      return row.user_id === identity.userId;
    }
    if (identity.email) {
      return row.author_email.trim().toLowerCase() === identity.email.trim().toLowerCase();
    }
    return false;
  });

  return {
    avg: values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : 0,
    count: values.length,
    userValue: match ? asNumber(match.value) : null,
  };
}

export async function getRatingsSummaryByRecipeIds(
  recipeIds: string[],
  identity: { userId?: string | null; email?: string | null } = {},
) {
  const rows = await readTable("ratings");
  return recipeIds.reduce<Record<string, RecipeRatingSummary>>((acc, recipeId) => {
    acc[recipeId] = buildSummary(rows, recipeId, identity);
    return acc;
  }, {});
}

export async function upsertRating(input: {
  recipeId: string;
  value: number;
  userId?: string | null;
  authorEmail: string;
}) {
  if (input.value < 1 || input.value > 5) {
    throw new ApiError(400, "Rating value must be between 1 and 5");
  }

  const authorEmail = input.authorEmail.trim().toLowerCase();
  const createdAt = nowIso();

  const rows = await mutateTable("ratings", async (current) => {
    const index = current.findIndex((row) => {
      if (input.userId) {
        return row.user_id === input.userId && row.recipe_id === input.recipeId;
      }
      return row.author_email.trim().toLowerCase() === authorEmail && row.recipe_id === input.recipeId;
    });

    const nextRow: SheetRecord<"ratings"> = {
      id: index >= 0 ? current[index].id : crypto.randomUUID(),
      user_id: input.userId ?? "",
      recipe_id: input.recipeId,
      author_email: authorEmail,
      value: String(input.value),
      created_at: index >= 0 ? current[index].created_at : createdAt,
    };

    if (index >= 0) {
      const next = [...current];
      next[index] = nextRow;
      return next;
    }

    return [...current, nextRow];
  });

  return buildSummary(rows, input.recipeId, {
    userId: input.userId,
    email: authorEmail,
  });
}
