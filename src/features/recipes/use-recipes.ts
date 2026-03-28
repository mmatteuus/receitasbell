import { useQuery } from "@tanstack/react-query";
import { listPublicRecipes, getRecipeBySlug } from "@/lib/repos/recipeRepo";

export function usePublicRecipes(
  params: {
    categorySlug?: string;
    q?: string;
    ids?: string[];
    tier?: "all" | "free" | "paid";
    tempo?: "all" | "quick" | "medium" | "long";
    ordem?: "latest" | "timeAsc" | "timeDesc";
  } = {},
) {
  return useQuery({
    queryKey: ["recipes", params],
    queryFn: () => listPublicRecipes(params),
  });
}

export function useRecipeBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["recipe", slug],
    queryFn: () => getRecipeBySlug(slug!),
    enabled: Boolean(slug),
  });
}
