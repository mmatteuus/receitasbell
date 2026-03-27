import type { VercelRequest } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../shared/env.js';
import { ApiError } from '../shared/http.js';
import { getUserSession } from '../auth/sessions.js';
import { requireTenantFromRequest } from '../tenancy/resolver.js';

export type AdminApiKeyAccess = {
  type: "api_key";
};

export type AdminSessionAccess = {
  type: "session";
  role: "admin" | "owner";
  userId: string;
  email: string;
  tenantId: string;
};

export type AdminAccessResult = AdminApiKeyAccess | AdminSessionAccess;

function safeStringEquals(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

/**
 * Enforces admin access.
 * Can be via x-admin-token header (programmatic) or a valid admin session.
 * For session-based access, it also verifies tenant ownership.
 */
export async function assertAdminAccess(request: VercelRequest): Promise<AdminAccessResult> {
  const adminToken = request.headers['x-admin-token'];
  const authHeader = request.headers.authorization;
  const secret = env.ADMIN_API_SECRET;
  
  // 1. Check header token (API Secret - Master Token)
  if (secret && typeof adminToken === 'string' && adminToken && safeStringEquals(adminToken, secret)) {
    return { type: 'api_key' as const };
  }
  if (secret && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice('Bearer '.length);
    if (bearerToken && safeStringEquals(bearerToken, secret)) {
      return { type: 'api_key' as const };
    }
  }

  // 2. Check for session with admin role
  const session = await getUserSession(request);
  if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
    throw new ApiError(403, 'Forbidden: Admin access required');
  }

  // 3. Session admin/owner must match tenant context.
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
