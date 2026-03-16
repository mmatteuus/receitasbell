import type { Comment } from "../../types/recipe.js";
import { ApiError } from "../http.js";
import { SheetRecord } from "./schema.js";
import { mutateTable, readTable } from "./table.js";
import { nowIso, sanitizeForSpreadsheet } from "./utils.js";

function mapComment(row: SheetRecord<"comments">): Comment {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id || null,
    author: row.author_name,
    authorEmail: row.author_email,
    text: row.text,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listCommentsByRecipeId(recipeId: string) {
  const rows = await readTable("comments");
  return rows
    .filter((row) => row.recipe_id === recipeId && (!row.status || row.status === "approved"))
    .map(mapComment)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createComment(input: {
  recipeId: string;
  authorName: string;
  authorEmail: string;
  userId?: string | null;
  text: string;
}) {
  const authorName = sanitizeForSpreadsheet(input.authorName.trim());
  const authorEmail = sanitizeForSpreadsheet(input.authorEmail.trim().toLowerCase());
  const text = sanitizeForSpreadsheet(input.text.trim());
  if (!authorName || !authorEmail || !text) {
    throw new ApiError(400, "Comment requires author name, author email and text");
  }

  const id = crypto.randomUUID();
  const createdAt = nowIso();

  const rows = await mutateTable("comments", async (current) => [
    ...current,
      {
        id,
        user_id: input.userId ?? "",
        recipe_id: input.recipeId,
        author_name: authorName,
        author_email: authorEmail,
        text,
        status: "approved",
        created_at: createdAt,
      },
  ]);

  return mapComment(rows.find((row) => row.id === id)!);
}
