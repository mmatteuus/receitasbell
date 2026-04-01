import { DEFAULT_SITE_SETTINGS } from '@/lib/defaults';
import type { SettingsMap } from '@/types/settings';

type UnknownSettings = Partial<SettingsMap> & {
  canonicalBaseUrl?: unknown;
  siteUrl?: unknown;
  publicBaseUrl?: unknown;
  appBaseUrl?: unknown;
};

function normalizeBaseUrl(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function readConfiguredBaseUrl(settings?: UnknownSettings | null) {
  const fromSettings = normalizeBaseUrl(
    settings?.canonicalBaseUrl ??
      settings?.siteUrl ??
      settings?.publicBaseUrl ??
      settings?.appBaseUrl
  );
  if (fromSettings) {
    return fromSettings;
  }

  const fromEnv = normalizeBaseUrl(
    import.meta.env.VITE_CANONICAL_BASE_URL ?? import.meta.env.VITE_SITE_URL
  );
  if (fromEnv) {
    return fromEnv;
  }

  return null;
}

function resolveCanonicalUrl(canonicalPath: string | undefined, baseUrl: string | null) {
  if (!canonicalPath || !baseUrl) {
    return undefined;
  }

  try {
    if (/^https?:\/\//i.test(canonicalPath)) {
      return new URL(canonicalPath).toString();
    }

    return new URL(canonicalPath, `${baseUrl}/`).toString();
  } catch {
    return undefined;
  }
}

export function resolveSiteMeta(options: {
  settings?: UnknownSettings | null;
  canonicalPath?: string;
}) {
  const settings = options.settings;
  const siteName = settings?.siteName || DEFAULT_SITE_SETTINGS.siteName;
  const canonicalBaseUrl = readConfiguredBaseUrl(settings);

  return {
    siteName,
    canonicalBaseUrl,
    canonicalUrl: resolveCanonicalUrl(options.canonicalPath, canonicalBaseUrl),
  };
}
