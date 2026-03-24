import type { VercelRequest, VercelResponse } from "@vercel/node";
import { env } from "../shared/env.js";
import {
  getUserSession,
  signSession,
  setUserSessionCookie,
  clearUserSessionCookie,
} from "../auth/sessions.js";
// import { verifyPassword } from "../auth/passwords.js"; // Placeholder if not implemented yet
import { countTenants, getTenantBySlug } from "../tenancy/repo.js";
import { requireTenantFromRequest } from "../tenancy/resolver.js";
import {
  ApiError,
  sendJson,
} from "../shared/http.js";
import { createAuditLog } from "../audit/service.js";
import { findUserByEmail } from "../identity/repo.js";

export type AdminSessionResponse = {
  authenticated: boolean;
  mode: "bootstrap" | "tenant";
  bootstrapRequired: boolean;
  tenant: { id: string; slug: string; name: string } | null;
  user: { id: string; email: string; role: string } | null;
};

export async function readAdminSession(request: VercelRequest): Promise<AdminSessionResponse> {
  const tenantCount = await countTenants();
  const session = await getUserSession(request);
  const isAdmin = session && (session.role === 'admin' || session.role === 'superadmin');

  if (tenantCount === 0) {
    return {
      authenticated: false,
      mode: "bootstrap",
      bootstrapRequired: true,
      tenant: null,
      user: null,
    };
  }

  // Attempt to resolve tenant from request
  let resolvedTenant = null;
  try {
    const { tenant } = await requireTenantFromRequest(request);
    resolvedTenant = tenant;
  } catch (e) {
    // Optional on session read
  }

  return {
    authenticated: !!isAdmin,
    mode: "tenant",
    bootstrapRequired: false,
    tenant: resolvedTenant ? { id: String(resolvedTenant.id), slug: resolvedTenant.slug, name: resolvedTenant.name } : null,
    user: isAdmin ? { id: session.userId, email: session.email, role: session.role } : null,
  };
}

export async function loginAdmin(
  request: VercelRequest,
  response: VercelResponse,
  input: { email?: string; password?: string }
) {
  const tenantCount = await countTenants();
  
  // 1. Bootstrap mode if no tenants exist
  if (tenantCount === 0) {
    if (input.password === env.ADMIN_API_SECRET) {
      // Create session for bootstrap
      const sessionToken = signSession({
        sessionId: crypto.randomUUID(),
        userId: 'bootstrap',
        email: 'admin@system',
        role: 'superadmin',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour
      });
      setUserSessionCookie(response, sessionToken);
      return { mode: 'bootstrap', authenticated: true };
    }
    throw new ApiError(401, "Invalid bootstrap password");
  }

  // 2. Regular Tenant Admin Login
  const { tenant } = await requireTenantFromRequest(request);
  const email = input.email?.trim().toLowerCase();
  
  if (!email || !input.password) {
    throw new ApiError(400, "Email and password required");
  }

  // Find user in identity repo
  const user = await findUserByEmail(tenant.id, email);
  if (!user || user.role !== 'admin') {
    throw new ApiError(401, "Invalid credentials or insufficient permissions");
  }

  // TODO: Implement verifyPassword logic. For now, we assume a match if it equals the secret
  // or just throw until Phase 3.
  if (input.password !== env.ADMIN_API_SECRET) {
     throw new ApiError(401, "Invalid password (using API Secret for now)");
  }

  const sessionToken = signSession({
    sessionId: crypto.randomUUID(),
    userId: String(user.id),
    email: user.email,
    role: 'admin',
    tenantId: String(tenant.id),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24h
  });

  setUserSessionCookie(response, sessionToken);

  await createAuditLog(request, {
    tenantId: String(tenant.id),
    actorType: 'admin',
    actorId: String(user.id),
    action: 'admin.login',
    resourceType: 'session',
    resourceId: String(user.id),
    payload: { email: user.email },
  });

  return { authenticated: true, user: { id: user.id, email: user.email, role: 'admin' } };
}

export async function logoutAdmin(request: VercelRequest, response: VercelResponse) {
  clearUserSessionCookie(response);
  return { authenticated: false };
}

// createTenantBootstrap should be refined in Phase 2/3
export async function bootstrapTenantAdmin(request: VercelRequest, response: VercelResponse, input: any) {
    const session = await getUserSession(request);
    if (!session || session.role !== 'superadmin') {
      throw new ApiError(401, "Bootstrap session required");
    }
    // implementation placeholder
    return { success: true };
}
