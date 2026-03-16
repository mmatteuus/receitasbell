import type { Recipe } from "@/types/recipe";

const RECIPE_PLACEHOLDER = "/placeholder.svg";

function toDisplayCategory(slug?: string) {
  if (!slug) return "cozinha da casa";
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isGenericTitle(title: string) {
  const normalized = normalizeSpaces(title);
  return normalized.length <= 24 && normalized.split(" ").length <= 3;
}

function buildSmartTitle(recipe: Recipe) {
  const base = normalizeSpaces(recipe.title || "");
  if (!base) return "Receita da casa";
  if (!isGenericTitle(base)) return base;

  if (recipe.totalTime > 0 && recipe.totalTime <= 30) {
    return `${base} com preparo rápido e resultado caprichado`;
  }

  if (recipe.accessTier === "paid") {
    return `${base} em versão especial para ocasiões marcantes`;
  }

  const category = toDisplayCategory(recipe.categorySlug).toLowerCase();
  return `${base} com toque autoral da ${category}`;
}

function buildSubtitle(recipe: Recipe) {
  const source = normalizeSpaces(recipe.excerpt || recipe.description || "");
  if (source.length >= 45) return source;

  const hints: string[] = [];
  if (recipe.totalTime > 0) hints.push(`${recipe.totalTime} min`);
  if (recipe.servings > 0) hints.push(`${recipe.servings} porções`);
  if (recipe.tags?.length) hints.push(recipe.tags.slice(0, 2).join(" • "));

  const category = toDisplayCategory(recipe.categorySlug);
  const details = hints.length ? ` • ${hints.join(" • ")}` : "";
  return `Receita de ${category.toLowerCase()} pensada para o dia a dia com sabor e praticidade${details}.`;
}

function buildHeadline(recipe: Recipe, cardTitle: string) {
  if (recipe.accessTier === "paid") {
    return `${cardTitle} para uma experiência premium na sua cozinha`;
  }
  return `${cardTitle} para cozinhar com confiança e prazer`;
}

export function getRecipeImage(recipe: Pick<Recipe, "imageUrl" | "image">) {
  const url = recipe.imageUrl?.trim();
  if (url) return url;

  const legacy = recipe.image?.trim();
  if (legacy) return legacy;

  return RECIPE_PLACEHOLDER;
}

export type RecipePresentation = {
  cardTitle: string;
  cardSubtitle: string;
  marketingHeadline: string;
  imageUrl: string;
};

export function getRecipePresentation(recipe: Recipe): RecipePresentation {
  const cardTitle = buildSmartTitle(recipe);
  const cardSubtitle = buildSubtitle(recipe);

  return {
    cardTitle,
    cardSubtitle,
    marketingHeadline: buildHeadline(recipe, cardTitle),
    imageUrl: getRecipeImage(recipe),
  };
}

export function normalizeRecipeForUI(recipe: Recipe): Recipe {
  const presentation = getRecipePresentation(recipe);
  return {
    ...recipe,
    imageUrl: presentation.imageUrl,
    image: presentation.imageUrl,
    cardTitle: presentation.cardTitle,
    cardSubtitle: presentation.cardSubtitle,
    marketingHeadline: presentation.marketingHeadline,
    excerpt: recipe.excerpt || presentation.cardSubtitle,
  };
}
