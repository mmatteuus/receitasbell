import { DEFAULT_PAYMENT_SETTINGS, DEFAULT_SITE_SETTINGS, PAYMENT_SETTING_KEYS, SITE_SETTING_KEYS } from "../../lib/defaults.js";
import type { SettingsMap } from "../../types/settings.js";
import { readTable, writeTable } from "./table.js";

function defaultSettingsMap(): Record<string, string> {
  return {
    ...Object.fromEntries(
      Object.entries(DEFAULT_SITE_SETTINGS).map(([key, value]) => [key, String(value)]),
    ),
    ...Object.fromEntries(
      Object.entries(DEFAULT_PAYMENT_SETTINGS).map(([key, value]) => [key, String(value)]),
    ),
  };
}

export async function getSettingsMap() {
  const rows = await readTable("settings");
  if (!rows.length) {
    const defaults = defaultSettingsMap();
    await writeTable(
      "settings",
      Object.entries(defaults).map(([key, value]) => ({ key, value })),
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
    "settings",
    Object.entries(next).map(([key, value]) => ({ key, value })),
  );

  return next;
}

export function mapTypedSettings(raw: Record<string, string>): SettingsMap {
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
  };
}

export const PUBLIC_SETTINGS_KEYS = [...SITE_SETTING_KEYS];
export const PAYMENT_SETTINGS_PUBLIC_KEYS = [...PAYMENT_SETTING_KEYS];
