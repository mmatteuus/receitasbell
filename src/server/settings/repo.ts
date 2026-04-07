import {
  DEFAULT_HOME_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_SITE_SETTINGS,
} from "../../lib/defaults.js";
import type { FeaturedMode, HomeSectionId, SettingsMap } from "../../types/settings.js";
import { supabase, supabaseAdmin } from "../integrations/supabase/client.js";

const HOME_SECTION_IDS: HomeSectionId[] = [
  "hero",
  "trustBar",
  "categories",
  "featured",
  "premium",
  "gratin",
  "recent",
  "about",
  "newsletter",
];

const FEATURED_MODES: FeaturedMode[] = ["manual", "latest", "category", "featuredFlag"];

function defaultSettingsMap(): Record<string, string> {
  return {
    ...Object.fromEntries(
      Object.entries(DEFAULT_SITE_SETTINGS).map(([key, value]) => [key, String(value)])
    ),
    ...Object.fromEntries(
      Object.entries(DEFAULT_PAYMENT_SETTINGS).map(([key, value]) => [key, String(value)])
    ),
    ...Object.fromEntries(
      Object.entries(DEFAULT_HOME_SETTINGS).map(([key, value]) => [
        key,
        Array.isArray(value) ? JSON.stringify(value) : String(value),
      ])
    ),
  };
}

export async function getSettingsMap(tenantId: string | number) {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .eq("tenant_id", tenantId);
  
  const defaults = defaultSettingsMap();
  
  if (error || !data || data.length === 0) {
    return defaults;
  }

  return data.reduce<Record<string, string>>((acc, row) => {
    if (!row.key) return acc;
    acc[row.key] = row.value ?? "";
    return acc;
  }, defaults);
}

export async function updateSettings(tenantId: string | number, settings: Record<string, unknown>) {
  for (const [key, value] of Object.entries(settings)) {
    const { error } = await supabaseAdmin
      .from("settings")
      .upsert({
          tenant_id: tenantId,
          key,
          value: String(value),
          updated_at: new Date().toISOString()
      }, { onConflict: "tenant_id, key" });
    
    if (error) throw error;
  }

  return getSettingsMap(tenantId);
}

function parseBooleanSetting(value: string | undefined, fallback: boolean) {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseNumberSetting(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseStringArraySetting(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Legacy comma-separated fallback
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFeaturedMode(value: string | undefined): FeaturedMode {
  if (value && FEATURED_MODES.includes(value as FeaturedMode)) {
    return value as FeaturedMode;
  }
  return DEFAULT_HOME_SETTINGS.featuredMode;
}

export function mapTypedSettings(raw: Record<string, string>): SettingsMap {
  const homeSectionsOrder = parseStringArraySetting(raw.homeSectionsOrder, DEFAULT_HOME_SETTINGS.homeSectionsOrder)
    .filter((value): value is HomeSectionId => HOME_SECTION_IDS.includes(value as HomeSectionId));

  return {
    siteName: raw.siteName || DEFAULT_SITE_SETTINGS.siteName,
    siteDescription: raw.siteDescription || DEFAULT_SITE_SETTINGS.siteDescription,
    siteUrl: raw.siteUrl || DEFAULT_SITE_SETTINGS.siteUrl,
    logoUrl: raw.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl,
    primaryColor: raw.primaryColor || DEFAULT_SITE_SETTINGS.primaryColor,
    secondaryColor: raw.secondaryColor || DEFAULT_SITE_SETTINGS.secondaryColor,
    accentColor: raw.accentColor || DEFAULT_SITE_SETTINGS.accentColor,
    headingFont: raw.headingFont || DEFAULT_SITE_SETTINGS.headingFont,
    bodyFont: raw.bodyFont || DEFAULT_SITE_SETTINGS.bodyFont,
    payment_mode: raw.payment_mode === "production" ? "production" : DEFAULT_PAYMENT_SETTINGS.payment_mode,
    webhooks_enabled: parseBooleanSetting(raw.webhooks_enabled, DEFAULT_PAYMENT_SETTINGS.webhooks_enabled),
    payment_topic_enabled: parseBooleanSetting(raw.payment_topic_enabled, DEFAULT_PAYMENT_SETTINGS.payment_topic_enabled),
    heroBadge: raw.heroBadge || DEFAULT_HOME_SETTINGS.heroBadge,
    heroTitle: raw.heroTitle || DEFAULT_HOME_SETTINGS.heroTitle,
    heroSubtitle: raw.heroSubtitle || DEFAULT_HOME_SETTINGS.heroSubtitle,
    heroImageUrl: raw.heroImageUrl || DEFAULT_HOME_SETTINGS.heroImageUrl,
    heroPrimaryCtaLabel: raw.heroPrimaryCtaLabel || DEFAULT_HOME_SETTINGS.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: raw.heroPrimaryCtaHref || DEFAULT_HOME_SETTINGS.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: raw.heroSecondaryCtaLabel || DEFAULT_HOME_SETTINGS.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: raw.heroSecondaryCtaHref || DEFAULT_HOME_SETTINGS.heroSecondaryCtaHref,
    featuredSectionTitle: raw.featuredSectionTitle || DEFAULT_HOME_SETTINGS.featuredSectionTitle,
    featuredSectionSubtitle: raw.featuredSectionSubtitle || DEFAULT_HOME_SETTINGS.featuredSectionSubtitle,
    featuredMode: parseFeaturedMode(raw.featuredMode),
    featuredRecipeIds: parseStringArraySetting(raw.featuredRecipeIds, DEFAULT_HOME_SETTINGS.featuredRecipeIds),
    featuredCategorySlug: raw.featuredCategorySlug || DEFAULT_HOME_SETTINGS.featuredCategorySlug,
    featuredLimit: parseNumberSetting(raw.featuredLimit, DEFAULT_HOME_SETTINGS.featuredLimit),
    showCategoriesGrid: parseBooleanSetting(raw.showCategoriesGrid, DEFAULT_HOME_SETTINGS.showCategoriesGrid),
    showFeaturedRecipes: parseBooleanSetting(raw.showFeaturedRecipes, DEFAULT_HOME_SETTINGS.showFeaturedRecipes),
    showPremiumSection: parseBooleanSetting(raw.showPremiumSection, DEFAULT_HOME_SETTINGS.showPremiumSection),
    showGratinSection: parseBooleanSetting(raw.showGratinSection, DEFAULT_HOME_SETTINGS.showGratinSection),
    showRecentRecipes: parseBooleanSetting(raw.showRecentRecipes, DEFAULT_HOME_SETTINGS.showRecentRecipes),
    showNewsletter: parseBooleanSetting(raw.showNewsletter, DEFAULT_HOME_SETTINGS.showNewsletter),
    showTrustBar: parseBooleanSetting(raw.showTrustBar, DEFAULT_HOME_SETTINGS.showTrustBar),
    showAboutSection: parseBooleanSetting(raw.showAboutSection, DEFAULT_HOME_SETTINGS.showAboutSection),
    trustBarItems: parseStringArraySetting(raw.trustBarItems, DEFAULT_HOME_SETTINGS.trustBarItems),
    aboutHeadline: raw.aboutHeadline || DEFAULT_HOME_SETTINGS.aboutHeadline,
    aboutText: raw.aboutText || DEFAULT_HOME_SETTINGS.aboutText,
    aboutImageUrl: raw.aboutImageUrl || DEFAULT_HOME_SETTINGS.aboutImageUrl,
    heroImageCaption: raw.heroImageCaption || DEFAULT_HOME_SETTINGS.heroImageCaption,
    heroImageSubtitle: raw.heroImageSubtitle || DEFAULT_HOME_SETTINGS.heroImageSubtitle,
    homeSectionsOrder: homeSectionsOrder.length ? homeSectionsOrder : DEFAULT_HOME_SETTINGS.homeSectionsOrder,
  };
}
