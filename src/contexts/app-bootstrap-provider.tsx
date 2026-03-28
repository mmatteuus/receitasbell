import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CATEGORIES, DEFAULT_HOME_SETTINGS, DEFAULT_PAYMENT_SETTINGS, DEFAULT_SITE_SETTINGS } from "@/lib/defaults";
import { getSettings } from "@/lib/api/settings";
import { applySiteSettings } from "@/lib/theme";
import type { Category } from "@/types/category";
import type { SettingsMap } from "@/types/settings";
import { logger } from "@/lib/logger";
import { getCategories } from "@/lib/repos/categoryRepo";
import { runOfflineSanityCheck } from "@/pwa/offline/db/open-db";
import { attachSyncOnOnline } from "@/pwa/offline/sync/sync-on-online";
import { attachSyncOnResume } from "@/pwa/offline/sync/sync-on-resume";

export const defaultSettings: SettingsMap = {
  ...DEFAULT_SITE_SETTINGS,
  ...DEFAULT_HOME_SETTINGS,
  ...DEFAULT_PAYMENT_SETTINGS,
};

export function useAppBootstrapProvider() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsMap>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const next = await getCategories();
      setCategories(next);
      return next;
    } catch (error) {
      logger.error("categories", error);
      return DEFAULT_CATEGORIES;
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const next = await getSettings();
      setSettings(next);
      return next;
    } catch (error) {
      logger.error("settings", error);
      return defaultSettings;
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void runOfflineSanityCheck().catch((error) => {
      logger.error("offline-db", error);
    });

    attachSyncOnOnline();
    attachSyncOnResume();

    void refreshCategories();
    void refreshSettings();
  }, [refreshCategories, refreshSettings]);

  useEffect(() => {
    applySiteSettings(settings);
  }, [settings]);

  return {
    categories,
    categoriesLoading,
    refreshCategories,
    settings,
    settingsLoading,
    refreshSettings,
  };
}
