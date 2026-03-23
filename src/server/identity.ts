import type { VercelRequest } from "@vercel/node";
import { findOrCreateUserByEmail, findUserByEmail } from "./baserow/usersRepo.js";
import { requireTenantFromRequest } from "./tenants/resolver.js";
import { getSessionFromRequest } from "./auth/sessions.js";
import { getIdentityEmail } from "./http.js";

export async function resolveOptionalIdentityUser(request: VercelRequest) {
  const session = getSessionFromRequest(request);
  const { tenant } = await requireTenantFromRequest(request);

  if (session && session.tenantId === String(tenant.id)) {
    return {
      email: session.email,
      user: { id: session.userId, email: session.email }, // Simplificado se não precisar dar fetch no baserow agora
    };
  }

  // Fallback para cookie antigo (legado)
  const legacyEmail = getIdentityEmail(request);
  if (legacyEmail) {
    return {
      email: legacyEmail,
      user: await findOrCreateUserByEmail(tenant.id, legacyEmail),
    };
  }

  return { email: null, user: null };
}

export async function requireIdentityUser(request: VercelRequest, displayName?: string) {
  const result = await resolveOptionalIdentityUser(request);
  if (!result.email) {
    throw new Error("Authentication required");
  }
  return result;
}
