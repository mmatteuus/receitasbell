import { fetchBaserow, BASEROW_TABLES } from "../integrations/baserow/client.js";

type RatingRow = {
  id?: string | number;
  tenantId?: string | number;
  recipeId?: string;
  userId?: string;
  authorEmail?: string;
  value?: number;
  updated_at?: string;
};

export async function upsertRating(
  tenantId: string | number,
  input: { recipeId: string; userId: string | undefined; value: number; authorEmail: string },
): Promise<RatingRow> {
  const now = new Date().toISOString();
  const filter = input.userId ? `&filter__userId__equal=${input.userId}` : `&filter__authorEmail__equal=${input.authorEmail}`;

  const existing = await fetchBaserow<{ results: RatingRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.RATINGS}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__recipeId__equal=${input.recipeId}${filter}`
  );

  if (existing.results[0]) {
    return await fetchBaserow<RatingRow>(`/api/database/rows/table/${BASEROW_TABLES.RATINGS}/${existing.results[0].id}/?user_field_names=true`, {
        method: "PATCH",
        body: JSON.stringify({ value: input.value, updated_at: now }),
    });
  }

  return await fetchBaserow<RatingRow>(`/api/database/rows/table/${BASEROW_TABLES.RATINGS}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({ ...input, tenantId: String(tenantId), updated_at: now }),
  });
}
