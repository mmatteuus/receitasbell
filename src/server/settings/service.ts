import type { VercelRequest } from "@vercel/node";
import type { SettingsMap } from "../../types/settings.js";
import type { AdminAccessResult } from "../admin/guards.js";
import { assertPaymentSettingsPatchAllowed } from "../admin/payments.js";
import { logAuditEvent } from "../audit/repo.js";
import { requireCsrf } from "../security/csrf.js";
import { getClientAddress } from "../shared/http.js";
import { getSettingsMap, mapTypedSettings, updateSettings } from "./repo.js";

function normalizeSettingsValue(value: unknown) {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return value;
}

export function extractSettingsPatch(input: Record<string, unknown>) {
  const nested = input.settings;
  const rawPatch =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : input;

  return Object.fromEntries(
    Object.entries(rawPatch).map(([key, value]) => [key, normalizeSettingsValue(value)]),
  );
}

export async function getTypedTenantSettings(tenantId: string | number): Promise<SettingsMap> {
  return mapTypedSettings(await getSettingsMap(tenantId));
}

export async function updateTenantSettingsFromRequest(input: {
  request: VercelRequest;
  tenantId: string | number;
  access: AdminAccessResult;
  body: Record<string, unknown>;
}) {
  if (input.access.type === "session") {
    requireCsrf(input.request);
  }

  const patch = extractSettingsPatch(input.body);
  await assertPaymentSettingsPatchAllowed(input.tenantId, patch);
  await updateSettings(input.tenantId, patch);

  const settings = await getTypedTenantSettings(input.tenantId);
  await logAuditEvent({
    tenantId: String(input.tenantId),
    actorType: input.access.type === "session" ? "admin" : "system",
    actorId: input.access.type === "session" ? String(input.access.userId) : "admin-api",
    action: "settings.update",
    resourceType: "settings",
    resourceId: "tenant",
    payload: { keys: Object.keys(patch) },
    ip: getClientAddress(input.request),
    userAgent: String(input.request.headers["user-agent"] ?? ""),
  });

  return settings;
}
