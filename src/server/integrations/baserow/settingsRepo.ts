import {
  DEFAULT_HOME_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_SITE_SETTINGS,
} from "../../../lib/defaults.js";
import type { HomeSectionId, SettingsMap } from "../../../types/settings.js";
import { fetchBaserow, BASEROW_TABLES } from "./client.js";

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
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.SETTINGS}/?user_field_names=true&filter__tenantId__equal=${tenantId}`
  );
  
  const defaults = defaultSettingsMap();
  
  if (!data.results.length) {
    return defaults;
  }

  return data.results.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, defaults);
}

export async function updateSettings(tenantId: string | number, settings: Record<string, any>) {
  const currentRows = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.SETTINGS}/?user_field_names=true&filter__tenantId__equal=${tenantId}`
  );
  
  const currentMap = currentRows.results.reduce((acc, row) => {
    acc[row.key] = row;
    return acc;
  }, {} as Record<string, any>);

  for (const [key, value] of Object.entries(settings)) {
    const existingRow = currentMap[key];
    if (existingRow) {
      await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.SETTINGS}/${existingRow.id}/?user_field_names=true`, {
        method: "PATCH",
        body: JSON.stringify({ value: String(value) }),
      });
    } else {
      await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.SETTINGS}/?user_field_names=true`, {
        method: "POST",
        body: JSON.stringify({ key, value: String(value), tenantId: String(tenantId) }),
      });
    }
  }

  return getSettingsMap(tenantId);
}

export function mapTypedSettings(raw: Record<string, string>): SettingsMap {
  const homeSectionsOrder = (raw.homeSectionsOrder || "")
    .split(",")
    .map((item) => item.trim())
    .filter((value): value is HomeSectionId => {
    return [
      "hero", "trustBar", "categories", "featured", "premium", "gratin", "recent", "about", "newsletter",
    ].includes(value);
  });

  return {
    siteName: raw.siteName || DEFAULT_SITE_SETTINGS.siteName,
    siteDescription: raw.siteDescription || DEFAULT_SITE_SETTINGS.siteDescription,
    logoUrl: raw.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl,
    primaryColor: raw.primaryColor || DEFAULT_SITE_SETTINGS.primaryColor,
    secondaryColor: raw.secondaryColor || DEFAULT_SITE_SETTINGS.secondaryColor,
    accentColor: raw.accentColor || DEFAULT_SITE_SETTINGS.accentColor,
    headingFont: raw.headingFont || DEFAULT_SITE_SETTINGS.headingFont,
    bodyFont: raw.bodyFont || DEFAULT_SITE_SETTINGS.bodyFont,
    payment_mode: raw.payment_mode === "production" ? "production" : "sandbox",
    webhooks_enabled: raw.webhooks_enabled === "true",
    payment_topic_enabled: raw.payment_topic_enabled !== "false",
    mp_access_token: raw.mp_access_token || DEFAULT_PAYMENT_SETTINGS.mp_access_token,
    mp_refresh_token: raw.mp_refresh_token || DEFAULT_PAYMENT_SETTINGS.mp_refresh_token,
    mp_public_key: raw.mp_public_key || DEFAULT_PAYMENT_SETTINGS.mp_public_key,
    mp_user_id: raw.mp_user_id || DEFAULT_PAYMENT_SETTINGS.mp_user_id,
    mp_client_id: raw.mp_client_id || DEFAULT_PAYMENT_SETTINGS.mp_client_id,
    mp_client_secret: raw.mp_client_secret || DEFAULT_PAYMENT_SETTINGS.mp_client_secret,
    mp_redirect_uri: raw.mp_redirect_uri || DEFAULT_PAYMENT_SETTINGS.mp_redirect_uri,
    mp_webhook_secret: raw.mp_webhook_secret || DEFAULT_PAYMENT_SETTINGS.mp_webhook_secret,
    app_base_url: raw.app_base_url || DEFAULT_PAYMENT_SETTINGS.app_base_url,
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
    featuredMode: "manual",
    featuredRecipeIds: [], 
    featuredCategorySlug: "",
    featuredLimit: 6,
    showCategoriesGrid: raw.showCategoriesGrid !== "false",
    showFeaturedRecipes: raw.showFeaturedRecipes !== "false",
    showPremiumSection: raw.showPremiumSection !== "false",
    showGratinSection: raw.showGratinSection !== "false",
    showRecentRecipes: raw.showRecentRecipes !== "false",
    showNewsletter: raw.showNewsletter !== "false",
    showTrustBar: raw.showTrustBar !== "false",
    showAboutSection: raw.showAboutSection !== "false",
    trustBarItems: [],
    aboutHeadline: raw.aboutHeadline || DEFAULT_HOME_SETTINGS.aboutHeadline,
    aboutText: raw.aboutText || DEFAULT_HOME_SETTINGS.aboutText,
    aboutImageUrl: raw.aboutImageUrl || DEFAULT_HOME_SETTINGS.aboutImageUrl,
    heroImageCaption: raw.heroImageCaption || DEFAULT_HOME_SETTINGS.heroImageCaption,
    heroImageSubtitle: raw.heroImageSubtitle || DEFAULT_HOME_SETTINGS.heroImageSubtitle,
    homeSectionsOrder: homeSectionsOrder.length ? homeSectionsOrder : DEFAULT_HOME_SETTINGS.homeSectionsOrder,
  };
}
