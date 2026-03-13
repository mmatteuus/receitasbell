import type { SettingsMap } from "@/types/settings";
import { jsonFetch } from "./client";

export async function getSettings() {
  const result = await jsonFetch<{ settings: SettingsMap }>("/api/settings");
  return result.settings;
}

export async function updateSettings(settings: Partial<SettingsMap>) {
  const result = await jsonFetch<{ settings: SettingsMap }>("/api/settings", {
    method: "PUT",
    admin: true,
    body: { settings },
  });
  return result.settings;
}

