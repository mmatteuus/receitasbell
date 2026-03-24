import type { VercelRequest } from '@vercel/node';
import { env } from '../shared/env.js';
import { ApiError } from '../shared/http.js';
import { getUserSession } from '../auth/sessions.js';
import { requireTenantFromRequest } from '../tenancy/resolver.js';

/**
 * Enforces admin access.
 * Can be via x-admin-token header (programmatic) or a valid admin session.
 * For session-based access, it also verifies tenant ownership.
 */
export async function assertAdminAccess(request: VercelRequest) {
  const adminToken = request.headers['x-admin-token'];
  const authHeader = request.headers.authorization;
  
  // 1. Check header token (API Secret - Master Token)
  if (adminToken === env.ADMIN_API_SECRET || authHeader === `Bearer ${env.ADMIN_API_SECRET}`) {
    return { type: 'api_key' as const };
  }

  // 2. Check for session with admin role
  const session = await getUserSession(request);
  if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
    throw new ApiError(403, 'Forbidden: Admin access required');
  }

  // 3. Superadmin has global access
  if (session.role === 'superadmin') {
    return { type: 'session' as const, role: session.role, userId: session.userId, email: session.email };
  }

  // 4. Regular admin must match tenantId
  const { tenant } = await requireTenantFromRequest(request);
  if (String(session.tenantId) !== String(tenant.id)) {
    throw new ApiError(403, 'Forbidden: This administrator does not have access to this tenant');
  }
  
  return { 
    type: 'session' as const, 
    role: session.role, 
    userId: session.userId, 
    email: session.email,
    tenantId: session.tenantId
  };
}

/**
 * Alias for legacy compatibility during refactor
 */
export async function requireAdminAccess(request: VercelRequest) {
  return assertAdminAccess(request);
}
