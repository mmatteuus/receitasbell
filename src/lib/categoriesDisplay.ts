import type { Category } from "@/types/recipe";

export function resolveCategoryDisplay(categories: Category[], categorySlug: string) {
  const match = categories.find((category) => category.slug === categorySlug);
  if (!match) {
    return {
      label: categorySlug.replace(/[-_]+/g, " "),
      emoji: "",
    };
  }

  return {
    label: match.name,
    emoji: match.emoji,
  };
}
