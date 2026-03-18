import { expect, test } from '@playwright/test';
import { getRecipeImage, getRecipePresentation } from '../src/lib/recipes/presentation';
import {
  pickFeaturedRecipes,
  pickGratinRecipes,
  pickPremiumRecipes,
} from '../src/lib/home/curation';
import type { Recipe } from '../src/types/recipe';
import type { SettingsMap } from '../src/types/settings';

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: overrides.id || crypto.randomUUID(),
    slug: overrides.slug || 'receita-teste',
    title: overrides.title || 'Receita Teste',
    description: overrides.description || 'Descricao',
    image: overrides.image,
    imageUrl: overrides.imageUrl,
    categorySlug: overrides.categorySlug || 'doces',
    tags: overrides.tags || [],
    status: overrides.status || 'published',
    prepTime: overrides.prepTime ?? 10,
    cookTime: overrides.cookTime ?? 20,
    totalTime: overrides.totalTime ?? 30,
    servings: overrides.servings ?? 4,
    accessTier: overrides.accessTier || 'free',
    priceBRL: overrides.priceBRL,
    fullIngredients: overrides.fullIngredients || ['item'],
    fullInstructions: overrides.fullInstructions || ['passo'],
    excerpt: overrides.excerpt,
    seoTitle: overrides.seoTitle,
    seoDescription: overrides.seoDescription,
    isFeatured: overrides.isFeatured,
    createdByUserId: overrides.createdByUserId,
    ratingAvg: overrides.ratingAvg,
    ratingCount: overrides.ratingCount,
    isUnlocked: overrides.isUnlocked,
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
    publishedAt: overrides.publishedAt || new Date().toISOString(),
  };
}

const baseSettings: SettingsMap = {
  siteName: 'Receitas Bell',
  siteDescription: '',
  logoUrl: '',
  primaryColor: '#000',
  secondaryColor: '#fff',
  accentColor: '#ddd',
  headingFont: 'DM Serif Display',
  bodyFont: 'DM Sans',
  payment_mode: 'sandbox',
  webhooks_enabled: true,
  payment_topic_enabled: true,
  heroBadge: '',
  heroTitle: '',
  heroSubtitle: '',
  heroImageUrl: '',
  heroPrimaryCtaLabel: '',
  heroPrimaryCtaHref: '/buscar',
  heroSecondaryCtaLabel: '',
  heroSecondaryCtaHref: '/buscar',
  featuredSectionTitle: '',
  featuredSectionSubtitle: '',
  featuredMode: 'featuredFlag',
  featuredRecipeIds: [],
  featuredCategorySlug: '',
  featuredLimit: 4,
  showCategoriesGrid: true,
  showFeaturedRecipes: true,
  showPremiumSection: true,
  showGratinSection: true,
  showRecentRecipes: true,
  showNewsletter: true,
  showTrustBar: true,
  showAboutSection: true,
  trustBarItems: [],
  aboutHeadline: '',
  aboutText: '',
  aboutImageUrl: '',
  homeSectionsOrder: ['hero', 'featured', 'newsletter'],
};

test('getRecipeImage resolve prioridade imageUrl -> image -> placeholder', async () => {
  expect(
    getRecipeImage(makeRecipe({ imageUrl: 'https://img/a.jpg', image: 'https://img/legacy.jpg' }))
  ).toBe('https://img/a.jpg');
  expect(getRecipeImage(makeRecipe({ imageUrl: '', image: 'https://img/legacy.jpg' }))).toBe(
    'https://img/legacy.jpg'
  );
  expect(getRecipeImage(makeRecipe({ imageUrl: '', image: '' }))).toBe('/placeholder.svg');
});

test('getRecipePresentation melhora titulo genérico', async () => {
  const recipe = makeRecipe({
    title: 'Receita Premium 123456',
    categorySlug: 'doces',
    tags: ['premium'],
  });
  const presentation = getRecipePresentation(recipe);
  expect(presentation.cardTitle.toLowerCase()).not.toContain('receita premium');
  expect(presentation.cardSubtitle.length).toBeGreaterThan(20);
});

test('curadoria respeita modo manual e remove premium duplicado', async () => {
  const recipes = [
    makeRecipe({ id: 'r1', title: 'A', accessTier: 'paid', isFeatured: true }),
    makeRecipe({ id: 'r2', title: 'B', accessTier: 'paid', isFeatured: true }),
    makeRecipe({ id: 'r3', title: 'C', accessTier: 'free', isFeatured: false }),
    makeRecipe({ id: 'r4', title: 'D', accessTier: 'paid', isFeatured: false }),
  ];
  const settings: SettingsMap = {
    ...baseSettings,
    featuredMode: 'manual',
    featuredRecipeIds: ['r1', 'r3'],
  };

  const featured = pickFeaturedRecipes(recipes, settings);
  expect(featured.map((recipe) => recipe.id)).toEqual(['r1', 'r3']);

  const premium = pickPremiumRecipes(recipes, featured, 4);
  expect(premium.map((recipe) => recipe.id)).toEqual(['r2', 'r4']);
});

test('curadoria de gratinados considera categoria e tag', async () => {
  const recipes = [
    makeRecipe({ id: 'g1', categorySlug: 'gratins', title: 'Gratinado de Batata' }),
    makeRecipe({
      id: 'g2',
      categorySlug: 'massas',
      tags: ['gratinado'],
      title: 'Lasanha Gratinada',
    }),
    makeRecipe({ id: 'g3', categorySlug: 'doces', title: 'Bolo' }),
  ];

  const gratins = pickGratinRecipes(recipes, 4);
  expect(gratins.map((recipe) => recipe.id)).toEqual(['g1', 'g2']);
});
