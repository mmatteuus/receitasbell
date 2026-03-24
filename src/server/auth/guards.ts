import type { VercelRequest } from "@vercel/node";
import { getUserSession } from "./sessions.js";
import { requireTenantFromRequest } from "../tenancy/resolver.js";
import { ApiError } from "../shared/http.js";

export async function resolveOptionalIdentityUser(request: VercelRequest) {
  const session = await getUserSession(request);
  if (!session) return { email: null, user: null };

  return {
    email: session.email,
    user: { id: session.userId, email: session.email, role: session.role },
  };
}

export async function requireIdentityUser(request: VercelRequest) {
  const result = await resolveOptionalIdentityUser(request);
  if (!result.email) {
    throw new ApiError(401, "Authentication required");
  }
  return result;
}

export async function requireAdminAccess(request: VercelRequest) {
  const result = await requireIdentityUser(request);
  if (result.user.role !== 'admin' && result.user.role !== 'superadmin') {
    throw new ApiError(403, "Admin access required");
  }
  return result;
}
