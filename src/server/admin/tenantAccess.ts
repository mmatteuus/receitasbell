import type { VercelRequest } from "@vercel/node";
import { requireTenantAdminSessionContext } from "../auth/sessions.js";
import { resolveTenantFromRequest } from "../tenants/resolver.js";
import { ApiError } from "../http.js";

export async function requireTenantAdminAccess(request: VercelRequest) {
  const sessionContext = await requireTenantAdminSessionContext(request).catch(() => null);
  const resolved = await resolveTenantFromRequest(request);

  // Se tiver sessão de tenant, valida se o tenant da sessão bate com o da URL (se houver)
  if (sessionContext) {
    if (resolved?.tenant && resolved.tenant.id !== sessionContext.tenant.id) {
      throw new ApiError(403, "Sessao autenticada para outro tenant.");
    }
    return {
      ...sessionContext,
      tenant: resolved?.tenant ?? sessionContext.tenant,
      resolution: resolved?.resolution ?? "session",
    };
  }

  // Se não tiver sessão de tenant, verifica se é o admin global (legado)
  const { hasAdminAccess } = await import("../http.js");
  if (hasAdminAccess(request)) {
    // Se for admin global e houver um tenant na URL, usamos esse tenant.
    // Se não, tentamos o primeiro tenant ou retornamos erro se precisar de contexto.
    if (resolved?.tenant) {
      return {
        tenant: resolved.tenant,
        tenantUser: { id: "legacy-admin", email: "admin@system", role: "admin", name: "Admin Geral" },
        resolution: resolved.resolution,
      };
    }
  }

  throw new ApiError(401, "Acesso administrativo (Tenant ou Global) obrigatorio.");
}
