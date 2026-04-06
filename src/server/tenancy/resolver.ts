import type { VercelRequest } from '@vercel/node';
import { ApiError } from '../shared/http.js';
import { getTenantBySlug, getTenantByHost, listActiveTenants } from './repo.js';

function normalizeHost(input: string) {
  return input.trim().toLowerCase().replace(/:\d+$/, '');
}

export async function requireTenantFromRequest(request: VercelRequest) {
  // Try priority orders: 1. Header, 2. Body, 3. Query
  const slugFromHeader = request.headers['x-tenant-slug'];
  const body = request.body as Record<string, unknown> | undefined;
  const slugFromBody = (body?.tenantSlug || body?.targetTenantSlug) as string | undefined;
  const query = request.query as Record<string, string | string[]> | undefined;
  const slugFromQuery = (query?.tenant || query?.slug) as string | undefined;

  const slug = String(slugFromHeader || slugFromBody || slugFromQuery || '').trim();
  const host = normalizeHost(String(request.headers['x-forwarded-host'] || request.headers.host || ''));

  if (slug) {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) throw new ApiError(404, `Tenant not found for slug: ${slug}`);
    return { tenant };
  }

  if (host) {
    const byHost = await getTenantByHost(host);
    if (byHost) return { tenant: byHost };

    const potentialSlug = host.split('.')[0];
    if (potentialSlug && potentialSlug !== 'www' && potentialSlug !== 'localhost') {
      const bySlug = await getTenantBySlug(potentialSlug);
      if (bySlug) return { tenant: bySlug };
    }
  }

  const activeTenants = await listActiveTenants();
  if (activeTenants.length === 1) {
    return { tenant: activeTenants[0] };
  }

  throw new ApiError(401, 'Tenant context is required.');
}

export function getTenantSlugFromRequest(request: VercelRequest): string | null {
  return (request.headers['x-tenant-slug'] as string) || null;
}
