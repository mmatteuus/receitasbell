import type { VercelRequest } from "@vercel/node";
// Note: Imports updated to reflect new domain structure (assuming repos are moved soon)
import { findOrCreateUserByEmail, findUserByEmail } from "../domains/users/repo.js";
import { requireTenantFromRequest } from "../domains/tenants/resolver.js";
import { getSessionFromRequest } from "../domains/auth/sessions.js";

export async function resolveOptionalIdentityUser(request: VercelRequest) {
  const session = getSessionFromRequest(request);
  const { tenant } = await requireTenantFromRequest(request);

  if (session && String(session.tenantId) === String(tenant.id)) {
    return {
      email: session.email,
      user: { id: session.userId, email: session.email }, 
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
