import type { SiteSettings } from "@/types/settings";

export type ThemePaletteId = "default" | "terracotta" | "sage" | "berry" | "ocean";

export type ThemePalette = {
  id: ThemePaletteId;
  label: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: "default",
    label: "Bell",
    description: "Usa as cores configuradas no site.",
    primaryColor: "#e8590c",
    secondaryColor: "#f5f5f4",
    accentColor: "#f5f5f4",
  },
  {
    id: "terracotta",
    label: "Terracota",
    description: "Mais quente e acolhedor.",
    primaryColor: "#c2410c",
    secondaryColor: "#fff7ed",
    accentColor: "#fed7aa",
  },
  {
    id: "sage",
    label: "Sálvia",
    description: "Verde suave e fresco.",
    primaryColor: "#4d7c0f",
    secondaryColor: "#f7fee7",
    accentColor: "#d9f99d",
  },
  {
    id: "berry",
    label: "Framboesa",
    description: "Tom vibrante e sofisticado.",
    primaryColor: "#be123c",
    secondaryColor: "#fff1f2",
    accentColor: "#fecdd3",
  },
  {
    id: "ocean",
    label: "Oceano",
    description: "Azul-esverdeado mais leve.",
    primaryColor: "#0f766e",
    secondaryColor: "#f0fdfa",
    accentColor: "#99f6e4",
  },
];

const themePaletteIds = new Set<ThemePaletteId>(THEME_PALETTES.map((palette) => palette.id));

function hexToHsl(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }

  h /= 6;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function setColorVariable(name: string, hex: string) {
  const hsl = hexToHsl(hex);
  document.documentElement.style.setProperty(name, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
}

export function isThemePaletteId(value: string): value is ThemePaletteId {
  return themePaletteIds.has(value as ThemePaletteId);
}

export function resolveThemePalette(paletteId: ThemePaletteId) {
  return THEME_PALETTES.find((palette) => palette.id === paletteId) ?? THEME_PALETTES[0];
}

export function resolveSiteSettings(
  settings: SiteSettings,
  paletteId: ThemePaletteId
): SiteSettings {
  if (paletteId === "default") {
    return settings;
  }

  const palette = resolveThemePalette(paletteId);
  return {
    ...settings,
    primaryColor: palette.primaryColor,
    secondaryColor: palette.secondaryColor,
    accentColor: palette.accentColor,
  };
}

export function applySiteSettings(settings: SiteSettings) {
  if (typeof document === "undefined") return;
  setColorVariable("--primary", settings.primaryColor);
  setColorVariable("--secondary", settings.secondaryColor);
  setColorVariable("--accent", settings.accentColor);
  setColorVariable("--ring", settings.primaryColor);
  document.documentElement.style.setProperty("--rb-body-font", `'${settings.bodyFont}', sans-serif`);
  document.documentElement.style.setProperty("--rb-heading-font", `'${settings.headingFont}', serif`);
}
