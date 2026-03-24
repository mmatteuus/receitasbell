import type { VercelRequest } from '@vercel/node';
import { ApiError } from '../shared/http.js';
import { getTenantBySlug } from './repo.js';

export async function requireTenantFromRequest(request: VercelRequest) {
  const slug = request.headers['x-tenant-slug'] as string;
  const host = request.headers.host || '';

  // 1. Tentar por header explícito (Admin/Mobile)
  if (slug) {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) throw new ApiError(404, `Tenant not found for slug: ${slug}`);
    return { tenant };
  }

  // 2. Tentar por subdomínio/host
  // Ex: tenant1.receitasbell.com.br
  const domainParts = host.split('.');
  if (domainParts.length >= 2) {
    const potentialSlug = domainParts[0];
    if (potentialSlug && potentialSlug !== 'www' && potentialSlug !== 'localhost') {
      const tenant = await getTenantBySlug(potentialSlug);
      if (tenant) return { tenant };
    }
  }

  // 3. Fallback ou erro se for obrigatório
  throw new ApiError(401, 'Tenant context is required. Missing x-tenant-slug header or invalid host.');
}

export function getTenantSlugFromRequest(request: VercelRequest): string | null {
  return (request.headers['x-tenant-slug'] as string) || null;
}
