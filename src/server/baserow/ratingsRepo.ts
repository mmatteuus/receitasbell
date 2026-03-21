import { fetchBaserow, BASEROW_TABLES } from "./client.js";

export async function upsertRating(tenantId: string | number, input: { recipeId: string; userId: string | undefined; value: number; authorEmail: string }): Promise<any> {
  const now = new Date().toISOString();
  // Busca se já existe avaliação do usuário para essa receita
  const filter = input.userId 
    ? `&filter__userId__equal=${input.userId}` 
    : `&filter__authorEmail__equal=${input.authorEmail}`;

  const existing = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.RATINGS}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__recipeId__equal=${input.recipeId}${filter}`
  );

  if (existing.results[0]) {
    return await fetchBaserow<any>(
      `/api/database/rows/table/${BASEROW_TABLES.RATINGS}/${existing.results[0].id}/?user_field_names=true`,
      {
        method: "PATCH",
        body: JSON.stringify({
          value: input.value,
          updated_at: now,
        }),
      }
    );
  }

  return await fetchBaserow<any>(
    `/api/database/rows/table/${BASEROW_TABLES.RATINGS}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        tenantId: String(tenantId),
        updated_at: now,
      }),
    }
  );
}
