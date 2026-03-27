import type { VercelRequest } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { env, isProd } from '../shared/env.js';
import { ApiError } from '../shared/http.js';
import { getUserSession } from '../auth/sessions.js';
import { requireTenantFromRequest } from '../tenancy/resolver.js';

export type AdminApiKeyAccess = {
  type: "api_key";
  tenantId: string;
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
 * Verifica se a request possui um x-admin-token válido com escopo de tenant.
 *
 * Regras de segurança:
 * - Em produção (isProd=true): o acesso por API key é BLOQUEADO. Apenas
 *   sessão de browser é aceita para rotas admin.
 * - Em desenvolvimento/preview: o token só é aceito se o header
 *   x-tenant-id (ou x-tenant-slug) estiver presente para escopo explícito.
 *   Isso evita acesso transversal global even em dev.
 *
 * NOTA: O acesso por API key global (sem tenant) foi removido intencionalmente.
 * Para automações internas (cron, CI), use o CRON_SECRET em rotas específicas.
 */
function tryApiKeyAccess(request: VercelRequest): AdminApiKeyAccess | null {
  // Em produção, token mestre não é aceito em rotas admin de browser
  if (isProd) return null;

  const secret = env.ADMIN_API_SECRET;
  if (!secret) return null;

  const adminToken = request.headers['x-admin-token'];
  const authHeader = request.headers.authorization;

  let tokenValue: string | null = null;
  if (typeof adminToken === 'string' && adminToken) {
    tokenValue = adminToken;
  } else if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    tokenValue = authHeader.slice('Bearer '.length);
  }

  if (!tokenValue || !safeStringEquals(tokenValue, secret)) return null;

  // Obrigamos escopo de tenant explícito mesmo em dev/preview
  const tenantId =
    (typeof request.headers['x-tenant-id'] === 'string' ? request.headers['x-tenant-id'] : null) ||
    (typeof request.headers['x-tenant-slug'] === 'string' ? request.headers['x-tenant-slug'] : null);

  if (!tenantId) return null;

  return { type: 'api_key' as const, tenantId };
}

/**
 * Enforces admin access via valid browser session only (in production).
 * In development/preview, also accepts scoped API key for test automation.
 *
 * For session-based access, verifies tenant ownership to prevent cross-tenant access.
 */
export async function assertAdminAccess(request: VercelRequest): Promise<AdminAccessResult> {
  // 1. Try scoped API key (dev/preview only)
  const apiKeyAccess = tryApiKeyAccess(request);
  if (apiKeyAccess) return apiKeyAccess;

  // 2. Require valid admin session
  const session = await getUserSession(request);
  if (!session || (session.role !== 'admin' && session.role !== 'owner')) {
    throw new ApiError(403, 'Forbidden: Admin access required');
  }

  // 3. Session admin/owner must match tenant context (prevents cross-tenant access)
  const { tenant } = await requireTenantFromRequest(request);
  if (String(session.tenantId) !== String(tenant.id)) {
    throw new ApiError(403, 'Forbidden: This administrator does not have access to this tenant');
  }

  return {
    type: 'session' as const,
    role: session.role,
    userId: session.userId,
    email: session.email,
    tenantId: session.tenantId,
  };
}

/**
 * Validates CSRF token for mutating admin operations from browser.
 * API key access (dev/preview only) bypasses CSRF since it's not a browser flow.
 *
 * Usage: call assertAdminAccess first, then assertCsrfIfSession.
 */
export function assertCsrfIfSession(
  access: AdminAccessResult,
  csrfGuard: () => void,
): void {
  if (access.type === 'session') {
    csrfGuard();
  }
}

/**
 * Alias for legacy compatibility during refactor
 */
export async function requireAdminAccess(request: VercelRequest) {
  return assertAdminAccess(request);
}
