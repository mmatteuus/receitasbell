import type { VercelRequest } from "@vercel/node";
import { getIdentityEmail, requireIdentityEmail } from "./http.js";
import { findOrCreateUserByEmail } from "./baserow/usersRepo.js";
import { requireTenantFromRequest } from "./tenants/resolver.js";

export async function resolveOptionalIdentityUser(request: VercelRequest) {
  const email = getIdentityEmail(request);
  if (!email) {
    return {
      email: null,
      user: null,
    };
  }

  const { tenant } = await requireTenantFromRequest(request);
  return {
    email,
    user: await findOrCreateUserByEmail(tenant.id, email),
  };
}

export async function requireIdentityUser(request: VercelRequest, displayName?: string) {
  const email = requireIdentityEmail(request);
  const { tenant } = await requireTenantFromRequest(request);
  return {
    email,
    user: await findOrCreateUserByEmail(tenant.id, email, displayName),
  };
}
