import type { Recipe } from '@/types/recipe';
import type { RecipeRecord } from '@/lib/recipes/types';

const RECIPE_PLACEHOLDER = '/placeholder.svg';

function toDisplayCategory(slug?: string) {
  if (!slug) return 'cozinha da casa';
  return slug
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function isGenericTitle(title: string) {
  const normalized = normalizeSpaces(title);
  const lowered = normalized.toLowerCase();
  if (/^receita\s+(premium|favorita)/.test(lowered)) return true;
  if (/^admin\s+playwright/.test(lowered)) return true;
  if (/\d{6,}/.test(lowered)) return true;
  return normalized.length <= 24 && normalized.split(' ').length <= 3;
}

type PresentableRecipe = Recipe & Partial<Pick<RecipeRecord, 'excerpt' | 'tags'>>;

function themedNameByCategory(recipe: PresentableRecipe) {
  const category = (recipe.categorySlug || '').toLowerCase();

  if (category === 'doces' || category === 'bolos') {
    return recipe.accessTier === 'paid'
      ? 'Sobremesa autoral com textura cremosa e finalização elegante'
      : 'Doce caseiro equilibrado, cremoso e fácil de acertar';
  }

  if (category === 'massas') {
    return recipe.accessTier === 'paid'
      ? 'Massa especial com molho encorpado e acabamento refinado'
      : 'Massa prática e saborosa para o dia a dia';
  }

  if (category === 'salgadas') {
    return recipe.accessTier === 'paid'
      ? 'Prato salgado especial com sabor marcante e apresentação caprichada'
      : 'Receita salgada caseira com preparo simples e resultado delicioso';
  }

  if (category === 'saudaveis') {
    return 'Receita leve e nutritiva com sabor de comida feita em casa';
  }

  if (category === 'bebidas') {
    return 'Bebida artesanal equilibrada para servir bem em qualquer ocasião';
  }

  return recipe.accessTier === 'paid'
    ? 'Receita especial da casa com acabamento premium'
    : 'Receita caseira com sabor, praticidade e ótima apresentação';
}

function buildSmartTitle(recipe: PresentableRecipe) {
  const base = normalizeSpaces(recipe.title || '');
  if (!base) return 'Receita da casa';
  if (!isGenericTitle(base)) return base;

  if (recipe.tags?.length) {
    const highlightedTag = recipe.tags
      .map((tag) => normalizeSpaces(tag))
      .find((tag) => tag && tag !== 'premium' && tag !== 'playwright' && tag !== 'teste');
    if (highlightedTag) {
      return `${highlightedTag[0].toUpperCase()}${highlightedTag.slice(1)} com preparo caprichado`;
    }
  }

  if (recipe.totalTime > 0 && recipe.totalTime <= 30) {
    return `${themedNameByCategory(recipe)} em versão rápida para a semana`;
  }

  return themedNameByCategory(recipe);
}

function buildSubtitle(recipe: PresentableRecipe) {
  const source = normalizeSpaces(recipe.excerpt || recipe.description || '');
  if (source.length >= 45) return source;

  const hints: string[] = [];
  if (recipe.totalTime > 0) hints.push(`${recipe.totalTime} min`);
  if (recipe.servings > 0) hints.push(`${recipe.servings} porções`);
  if (recipe.tags?.length) hints.push(recipe.tags.slice(0, 2).join(' • '));

  const category = toDisplayCategory(recipe.categorySlug);
  const details = hints.length ? ` • ${hints.join(' • ')}` : '';
  return `Receita de ${category.toLowerCase()} pensada para o dia a dia com sabor e praticidade${details}.`;
}

function buildHeadline(recipe: Recipe, cardTitle: string) {
  if (recipe.accessTier === 'paid') {
    return `${cardTitle} para uma experiência premium na sua cozinha`;
  }
  return `${cardTitle} para cozinhar com confiança e prazer`;
}

export function getRecipeImage(recipe: Pick<Recipe, 'imageUrl'>) {
  const url = recipe.imageUrl?.trim();
  if (url) return url;
  return RECIPE_PLACEHOLDER;
}

export type RecipePresentation = {
  cardTitle: string;
  cardSubtitle: string;
  marketingHeadline: string;
  imageUrl: string;
};

export function getRecipePresentation(recipe: PresentableRecipe): RecipePresentation {
  const cardTitle = buildSmartTitle(recipe);
  const cardSubtitle = buildSubtitle(recipe);

  return {
    cardTitle,
    cardSubtitle,
    marketingHeadline: buildHeadline(recipe, cardTitle),
    imageUrl: getRecipeImage(recipe),
  };
}

export function normalizeRecipeForUI(recipe: RecipeRecord): RecipeRecord {
  const imageUrl = getRecipeImage(recipe);

  // Normalizar ingredientes - lidar com objetos inesperados vindo do backend
  const fullIngredients = (recipe.fullIngredients || []).map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      return obj.text || obj.name || obj.item || obj.display || String(item);
    }
    return String(item);
  });

  // Normalizar instruções - lidar com objetos inesperados vindo do backend
  // Ex: { step: number, text: string } que causava o erro "Objects are not valid as a React child"
  const fullInstructions = (recipe.fullInstructions || []).map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      return obj.text || obj.display || obj.description || String(item);
    }
    return String(item);
  });

  return {
    ...recipe,
    imageUrl,
    fullIngredients: fullIngredients as string[],
    fullInstructions: fullInstructions as string[],
  };
}
