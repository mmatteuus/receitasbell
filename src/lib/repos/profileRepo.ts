import { getProfileOverviewOfflineAware } from "@/pwa/offline/repos/profile-offline-repo";
import type { Entitlement } from "@/types/entitlement";

export async function getProfileOverview() {
  return getProfileOverviewOfflineAware();
}

export async function listEntitlementsForProfile(): Promise<Entitlement[]> {
  // Now entitlements are resolved server-side; 
  // this client function is mostly legacy or can be refactored to check /api/auth/me
  return [];
}

export const profileRepo = {
  getOverview: getProfileOverview,
};
