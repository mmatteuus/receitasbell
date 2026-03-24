import { fetchBaserow, BASEROW_TABLES } from "../../integrations/baserow/client.js";

export interface Comment {
  id: string | number;
  recipeId: string;
  authorName: string;
  authorEmail: string;
  userId: string;
  text: string;
  createdAt: string;
  tenantId: string | number;
}

export async function listCommentsByRecipeId(tenantId: string | number, recipeId: string): Promise<Comment[]> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.COMMENTS}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__recipeId__equal=${recipeId}`
  );
  return data.results.map(row => ({
    id: row.id,
    recipeId: row.recipeId,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
    userId: row.userId,
    text: row.text,
    createdAt: row.created_at,
    tenantId: row.tenantId,
  }));
}

export async function createComment(tenantId: string | number, input: Omit<Comment, "id" | "createdAt" | "tenantId">): Promise<Comment> {
  const record = await fetchBaserow<any>(`/api/database/rows/table/${BASEROW_TABLES.COMMENTS}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({ ...input, tenantId: String(tenantId), created_at: new Date().toISOString() }),
  });
  return {
    id: record.id,
    recipeId: record.recipeId,
    authorName: record.authorName,
    authorEmail: record.authorEmail,
    userId: record.userId,
    text: record.text,
    createdAt: record.created_at,
    tenantId: record.tenantId,
  };
}
