import {
  DEFAULT_HOME_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  HOME_SETTING_KEYS,
  PAYMENT_SETTING_KEYS,
  SITE_SETTING_KEYS,
} from '../../lib/defaults.js';
import type { HomeSectionId, SettingsMap } from '../../types/settings.js';
import { readTable, writeTable } from './table.js';

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

export async function getSettingsMap() {
  const rows = await readTable('settings');
  if (!rows.length) {
    const defaults = defaultSettingsMap();
    await writeTable(
      'settings',
      Object.entries(defaults).map(([key, value]) => ({ key, value }))
    );
    return defaults;
  }

  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, defaultSettingsMap());
}

export async function saveSettings(partial: Record<string, string>) {
  const current = await getSettingsMap();
  const next = { ...current, ...partial };

  await writeTable(
    'settings',
    Object.entries(next).map(([key, value]) => ({ key, value }))
  );

  return next;
}

function parseStringList(raw: string | undefined, fallback: string[]) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // fallback below
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapTypedSettings(raw: Record<string, string>): SettingsMap {
  const homeSectionsOrder = parseStringList(
    raw.homeSectionsOrder,
    DEFAULT_HOME_SETTINGS.homeSectionsOrder
  ).filter((value): value is HomeSectionId => {
    return [
      'hero',
      'trustBar',
      'categories',
      'featured',
      'premium',
      'gratin',
      'recent',
      'about',
      'newsletter',
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
    payment_mode: raw.payment_mode === 'production' ? 'production' : 'sandbox',
    webhooks_enabled: raw.webhooks_enabled === 'true',
    payment_topic_enabled: raw.payment_topic_enabled !== 'false',
    mp_access_token: raw.mp_access_token || DEFAULT_PAYMENT_SETTINGS.mp_access_token,
    mp_refresh_token: raw.mp_refresh_token || DEFAULT_PAYMENT_SETTINGS.mp_refresh_token,
    mp_public_key: raw.mp_public_key || DEFAULT_PAYMENT_SETTINGS.mp_public_key,
    mp_user_id: raw.mp_user_id || DEFAULT_PAYMENT_SETTINGS.mp_user_id,
    heroBadge: raw.heroBadge || DEFAULT_HOME_SETTINGS.heroBadge,
    heroTitle: raw.heroTitle || DEFAULT_HOME_SETTINGS.heroTitle,
    heroSubtitle: raw.heroSubtitle || DEFAULT_HOME_SETTINGS.heroSubtitle,
    heroImageUrl: raw.heroImageUrl || DEFAULT_HOME_SETTINGS.heroImageUrl,
    heroPrimaryCtaLabel: raw.heroPrimaryCtaLabel || DEFAULT_HOME_SETTINGS.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: raw.heroPrimaryCtaHref || DEFAULT_HOME_SETTINGS.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: raw.heroSecondaryCtaLabel || DEFAULT_HOME_SETTINGS.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: raw.heroSecondaryCtaHref || DEFAULT_HOME_SETTINGS.heroSecondaryCtaHref,
    featuredSectionTitle: raw.featuredSectionTitle || DEFAULT_HOME_SETTINGS.featuredSectionTitle,
    featuredSectionSubtitle:
      raw.featuredSectionSubtitle || DEFAULT_HOME_SETTINGS.featuredSectionSubtitle,
    featuredMode:
      raw.featuredMode === 'manual' ||
      raw.featuredMode === 'latest' ||
      raw.featuredMode === 'category' ||
      raw.featuredMode === 'featuredFlag'
        ? raw.featuredMode
        : DEFAULT_HOME_SETTINGS.featuredMode,
    featuredRecipeIds: parseStringList(
      raw.featuredRecipeIds,
      DEFAULT_HOME_SETTINGS.featuredRecipeIds
    ),
    featuredCategorySlug: raw.featuredCategorySlug || DEFAULT_HOME_SETTINGS.featuredCategorySlug,
    featuredLimit:
      Number(raw.featuredLimit || DEFAULT_HOME_SETTINGS.featuredLimit) ||
      DEFAULT_HOME_SETTINGS.featuredLimit,
    showCategoriesGrid: raw.showCategoriesGrid !== 'false',
    showFeaturedRecipes: raw.showFeaturedRecipes !== 'false',
    showPremiumSection: raw.showPremiumSection !== 'false',
    showGratinSection: raw.showGratinSection !== 'false',
    showRecentRecipes: raw.showRecentRecipes !== 'false',
    showNewsletter: raw.showNewsletter !== 'false',
    showTrustBar: raw.showTrustBar !== 'false',
    showAboutSection: raw.showAboutSection !== 'false',
    trustBarItems: parseStringList(raw.trustBarItems, DEFAULT_HOME_SETTINGS.trustBarItems),
    aboutHeadline: raw.aboutHeadline || DEFAULT_HOME_SETTINGS.aboutHeadline,
    aboutText: raw.aboutText || DEFAULT_HOME_SETTINGS.aboutText,
    aboutImageUrl: raw.aboutImageUrl || DEFAULT_HOME_SETTINGS.aboutImageUrl,
    heroImageCaption: raw.heroImageCaption || DEFAULT_HOME_SETTINGS.heroImageCaption,
    heroImageSubtitle: raw.heroImageSubtitle || DEFAULT_HOME_SETTINGS.heroImageSubtitle,
    homeSectionsOrder: homeSectionsOrder.length
      ? homeSectionsOrder
      : DEFAULT_HOME_SETTINGS.homeSectionsOrder,
  };
}

export const PUBLIC_SETTINGS_KEYS = [...SITE_SETTING_KEYS, ...HOME_SETTING_KEYS];
export const PAYMENT_SETTINGS_PUBLIC_KEYS = [...PAYMENT_SETTING_KEYS];
