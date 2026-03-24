import type { VercelRequest } from "@vercel/node";
import { getUserSession } from "./sessions.js";
import { requireTenantFromRequest } from "../tenancy/resolver.js";
import { ApiError } from "../shared/http.js";

export async function resolveOptionalIdentityUser(request: VercelRequest) {
  const session = await getUserSession(request);
  if (!session) return { email: null, user: null };

  const { tenant } = await requireTenantFromRequest(request);

  // Note: For now we don't strictly bind session to tenant in this helper 
  // as the session data itself contains tenant info if needed in the future,
  // but we mostly use it for public user identity.
  
  return {
    email: session.email,
    user: { id: session.userId, email: session.email },
  };
}

export async function requireIdentityUser(request: VercelRequest) {
  const result = await resolveOptionalIdentityUser(request);
  if (!result.email) {
    throw new ApiError(401, "Authentication required");
  }
  return result;
}
