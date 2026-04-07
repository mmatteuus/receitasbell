import type { Category } from "../types/category.js";
import type { HomeSettings, PaymentSettings, SiteSettings } from "../types/settings.js";

const DEFAULT_CATEGORY_TIMESTAMP = "2024-01-01T00:00:00.000Z";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-salgadas", name: "Salgadas", slug: "salgadas", description: "Receitas salgadas para qualquer ocasião", createdAt: DEFAULT_CATEGORY_TIMESTAMP },
  { id: "cat-massas", name: "Massas", slug: "massas", description: "Massas caseiras e molhos especiais", createdAt: DEFAULT_CATEGORY_TIMESTAMP },
  { id: "cat-doces", name: "Doces", slug: "doces", description: "Sobremesas e doces irresistíveis", createdAt: DEFAULT_CATEGORY_TIMESTAMP },
  { id: "cat-bolos", name: "Bolos", slug: "bolos", description: "Bolos para todas as celebrações", createdAt: DEFAULT_CATEGORY_TIMESTAMP },
  { id: "cat-bebidas", name: "Bebidas", slug: "bebidas", description: "Bebidas refrescantes e especiais", createdAt: DEFAULT_CATEGORY_TIMESTAMP },
  { id: "cat-saudaveis", name: "Saudáveis", slug: "saudaveis", description: "Receitas leves e nutritivas", createdAt: DEFAULT_CATEGORY_TIMESTAMP },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "Receitas Bell",
  siteDescription: "Receitas testadas e aprovadas para tornar seus momentos na cozinha inesquecíveis.",
  siteUrl: "https://receitasbell.mtsferreira.dev",
  logoUrl: "",
  primaryColor: "#e8590c",
  secondaryColor: "#f5f5f4",
  accentColor: "#f5f5f4",
  headingFont: "DM Serif Display",
  bodyFont: "DM Sans",
};

export const DEFAULT_HOME_SETTINGS: HomeSettings = {
  heroBadge: "Curadoria da Semana",
  heroTitle: "Sabores que transformam sua cozinha em experiência",
  heroSubtitle:
    "Receitas testadas, explicadas passo a passo e organizadas para você cozinhar com mais prazer e menos dúvida.",
  heroImageUrl:
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80",
  heroPrimaryCtaLabel: "Explorar receitas",
  heroPrimaryCtaHref: "/buscar",
  heroSecondaryCtaLabel: "Ver exclusivas",
  heroSecondaryCtaHref: "/buscar?tier=paid",
  featuredSectionTitle: "Seleção editorial",
  featuredSectionSubtitle: "Uma curadoria especial para você cozinhar melhor hoje.",
  featuredMode: "featuredFlag",
  featuredRecipeIds: [],
  featuredCategorySlug: "",
  featuredLimit: 7,
  showCategoriesGrid: true,
  showFeaturedRecipes: true,
  showPremiumSection: true,
  showGratinSection: true,
  showRecentRecipes: true,
  showNewsletter: true,
  showTrustBar: true,
  showAboutSection: true,
  trustBarItems: [
    "Receitas testadas em cozinha real",
    "Lista de compras integrada para facilitar seu dia",
    "Favoritos, histórico e receitas desbloqueadas no mesmo lugar",
    "Novas receitas e coleções com curadoria toda semana",
  ],
  aboutHeadline: "Uma vitrine culinária prática e inspiradora",
  aboutText:
    "O Receitas Bell une visual editorial e utilidade real para quem quer cozinhar com confiança, descobrir novos sabores e manter suas receitas favoritas organizadas.",
  aboutImageUrl:
    "https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1200&q=80",
  heroImageCaption: "Seleção da Casa",
  heroImageSubtitle: "Receitas para impressionar sem complicar",
  homeSectionsOrder: ["hero", "trustBar", "categories", "featured", "premium", "gratin", "recent", "about", "newsletter"],
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  payment_mode: "sandbox",
  webhooks_enabled: true,
  payment_topic_enabled: true,
};

export const SITE_SETTING_KEYS = [
  "siteName",
  "siteDescription",
  "siteUrl",
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "headingFont",
  "bodyFont",
] as const;

export const PAYMENT_SETTING_KEYS = [
  "payment_mode",
  "webhooks_enabled",
  "payment_topic_enabled",
] as const;

export const HOME_SETTING_KEYS = [
  "heroBadge",
  "heroTitle",
  "heroSubtitle",
  "heroImageUrl",
  "heroPrimaryCtaLabel",
  "heroPrimaryCtaHref",
  "heroSecondaryCtaLabel",
  "heroSecondaryCtaHref",
  "featuredSectionTitle",
  "featuredSectionSubtitle",
  "featuredMode",
  "featuredRecipeIds",
  "featuredCategorySlug",
  "featuredLimit",
  "showCategoriesGrid",
  "showFeaturedRecipes",
  "showPremiumSection",
  "showGratinSection",
  "showRecentRecipes",
  "showNewsletter",
  "showTrustBar",
  "showAboutSection",
  "trustBarItems",
  "aboutHeadline",
  "aboutText",
  "aboutImageUrl",
  "heroImageCaption",
  "heroImageSubtitle",
  "homeSectionsOrder",
] as const;
