import type { Category } from "@/types/category";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveCategoryDisplay(categories: Category[], categorySlug: string) {
  const match = categories.find(
    (category) => category.slug === categorySlug || category.id === categorySlug,
  );

  if (match) {
    return { label: match.name };
  }

  // Não exibir UUIDs brutos para o usuário
  if (UUID_REGEX.test(categorySlug)) {
    return { label: "Receita" };
  }

  return {
    label: categorySlug.replace(/[-_]+/g, " "),
  };
}
