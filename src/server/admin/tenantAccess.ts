import type { VercelRequest } from "@vercel/node";
import { requireTenantAdminSessionContext } from "../auth/sessions.js";
import { resolveTenantFromRequest } from "../tenants/resolver.js";
import { ApiError } from "../http.js";

export async function requireTenantAdminAccess(request: VercelRequest) {
  const sessionContext = await requireTenantAdminSessionContext(request);
  const resolved = await resolveTenantFromRequest(request);

  if (resolved?.tenant && resolved.tenant.id !== sessionContext.tenant.id) {
    throw new ApiError(403, "Sessao autenticada para outro tenant.");
  }

  return {
    ...sessionContext,
    tenant: resolved?.tenant ?? sessionContext.tenant,
    resolution: resolved?.resolution ?? "session",
  };
}
