import type { Category } from "../types/recipe";
import type { PaymentSettings, SiteSettings } from "../types/settings";

export const DEFAULT_CATEGORIES: Category[] = [
  { name: "Salgadas", slug: "salgadas", emoji: "🧂", description: "Receitas salgadas para qualquer ocasião" },
  { name: "Massas", slug: "massas", emoji: "🍝", description: "Massas caseiras e molhos especiais" },
  { name: "Doces", slug: "doces", emoji: "🍬", description: "Sobremesas e doces irresistíveis" },
  { name: "Bolos", slug: "bolos", emoji: "🎂", description: "Bolos para todas as celebrações" },
  { name: "Bebidas", slug: "bebidas", emoji: "🥤", description: "Bebidas refrescantes e especiais" },
  { name: "Saudáveis", slug: "saudaveis", emoji: "🥗", description: "Receitas leves e nutritivas" },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "Receitas do Bell",
  siteDescription: "Receitas testadas e aprovadas para tornar seus momentos na cozinha inesquecíveis.",
  logoUrl: "",
  primaryColor: "#e8590c",
  secondaryColor: "#f5f5f4",
  accentColor: "#f5f5f4",
  headingFont: "DM Serif Display",
  bodyFont: "DM Sans",
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  payment_mode: "sandbox",
  webhooks_enabled: true,
  payment_topic_enabled: true,
};

export const SITE_SETTING_KEYS = [
  "siteName",
  "siteDescription",
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
