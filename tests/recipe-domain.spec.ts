import { expect, test } from '@playwright/test';
import { normalizeBRLInput, parseBRLInput } from '../src/lib/helpers';
import type { RecipeRecord } from '../src/lib/recipes/types';
import { getRecipeTeaser, uniqueSlug } from '../src/lib/repos/recipeRepo';
import { isRecipeUnlocked } from '../src/lib/utils/recipeAccess';

function makeRecipeRecord(overrides: Partial<RecipeRecord> = {}): RecipeRecord {
  return {
    id: overrides.id || crypto.randomUUID(),
    title: overrides.title || 'Receita Teste',
    slug: overrides.slug || 'receita-teste',
    description: overrides.description || 'Descricao de teste',
    imageUrl: overrides.imageUrl ?? null,
    categorySlug: overrides.categorySlug || 'doces',
    prepTime: overrides.prepTime ?? 10,
    cookTime: overrides.cookTime ?? 20,
    totalTime: overrides.totalTime ?? 30,
    servings: overrides.servings ?? 4,
    accessTier: overrides.accessTier || 'free',
    priceBRL: overrides.priceBRL ?? null,
    fullIngredients: overrides.fullIngredients || ['ingrediente 1', 'ingrediente 2', 'ingrediente 3'],
    fullInstructions: overrides.fullInstructions || ['passo 1', 'passo 2', 'passo 3'],
    status: overrides.status || 'draft',
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
    publishedAt: overrides.publishedAt ?? null,
    tags: overrides.tags || [],
    excerpt: overrides.excerpt,
    seoTitle: overrides.seoTitle,
    seoDescription: overrides.seoDescription,
    isFeatured: overrides.isFeatured,
    createdByUserId: overrides.createdByUserId ?? null,
    ratingAvg: overrides.ratingAvg,
    ratingCount: overrides.ratingCount,
    hasAccess: overrides.hasAccess,
    imageFileMeta: overrides.imageFileMeta ?? null,
  };
}

test('parseBRLInput aceita formatos comuns do admin', async () => {
  expect(parseBRLInput('7,90')).toBe(7.9);
  expect(parseBRLInput('7.90')).toBe(7.9);
  expect(parseBRLInput('10')).toBe(10);
  expect(normalizeBRLInput('7.9')).toBe('7,90');
});

test('uniqueSlug adiciona sufixos incrementais para colisões', async () => {
  const recipes = [
    makeRecipeRecord({ id: '1', slug: 'bolo-de-cenoura' }),
    makeRecipeRecord({ id: '2', slug: 'bolo-de-cenoura-2' }),
  ];

  expect(uniqueSlug('Bolo de Cenoura', recipes)).toBe('bolo-de-cenoura-3');
  expect(uniqueSlug('Bolo de Cenoura', recipes, '1')).toBe('bolo-de-cenoura');
});

test('getRecipeTeaser deriva os dois primeiros ingredientes e passos', async () => {
  const teaser = getRecipeTeaser(
    makeRecipeRecord({
      fullIngredients: ['ingrediente 1', 'ingrediente 2', 'ingrediente 3'],
      fullInstructions: ['passo 1', 'passo 2', 'passo 3'],
    })
  );

  expect(teaser.ingredients).toEqual(['ingrediente 1', 'ingrediente 2']);
  expect(teaser.instructions).toEqual(['passo 1', 'passo 2']);
});

test('isRecipeUnlocked respeita tier free e entitlement ativo', async () => {
  expect(isRecipeUnlocked({ accessTier: 'free' })).toBe(true);
  expect(isRecipeUnlocked({ accessTier: 'paid', hasAccess: false })).toBe(false);
  expect(isRecipeUnlocked({ accessTier: 'paid', hasAccess: true })).toBe(true);
});
