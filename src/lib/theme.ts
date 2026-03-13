import type { SiteSettings } from "@/types/settings";

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

export function applySiteSettings(settings: SiteSettings) {
  if (typeof document === "undefined") return;
  setColorVariable("--primary", settings.primaryColor);
  setColorVariable("--secondary", settings.secondaryColor);
  setColorVariable("--accent", settings.accentColor);
  setColorVariable("--ring", settings.primaryColor);
  document.documentElement.style.setProperty("--rb-body-font", `'${settings.bodyFont}', sans-serif`);
  document.documentElement.style.setProperty("--rb-heading-font", `'${settings.headingFont}', serif`);
}

