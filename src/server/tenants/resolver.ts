import type { VercelRequest } from "@vercel/node";
import { ApiError } from "../http.js";
import { getTenantAdminSessionClaims } from "../auth/sessions.js";
import { findTenantByHost, findTenantById, findTenantBySlug } from "./service.js";

function getSingleHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeTenantSlug(value: string | null | undefined) {
  if (!value) return null;
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || null;
}

export function normalizeHost(value: string | null | undefined) {
  if (!value) return null;
  return value.trim().toLowerCase().replace(/:\d+$/, "") || null;
}

export function getTenantSlugFromRequest(request: VercelRequest) {
  return normalizeTenantSlug(
    getSingleHeader(request.headers["x-tenant-slug"]) ||
      getSingleHeader(request.query.tenantSlug as string | string[] | undefined),
  );
}

export function getRequestHost(request: VercelRequest) {
  return normalizeHost(
    getSingleHeader(request.headers["x-forwarded-host"]) || getSingleHeader(request.headers.host),
  );
}

export async function resolveTenantFromRequest(request: VercelRequest) {
  const host = getRequestHost(request);
  if (host) {
    const byHost = await findTenantByHost(host);
    if (byHost) {
      return {
        tenant: byHost,
        resolution: "host" as const,
      };
    }
  }

  const slug = getTenantSlugFromRequest(request);
  if (slug) {
    const bySlug = await findTenantBySlug(slug);
    if (bySlug) {
      return {
        tenant: bySlug,
        resolution: "slug" as const,
      };
    }
  }

  const claims = getTenantAdminSessionClaims(request);
  if (claims?.tid) {
    const bySession = await findTenantById(claims.tid).catch(() => null);
    if (bySession) {
      return {
        tenant: bySession,
        resolution: "session" as const,
      };
    }
  }

  return null;
}

export async function requireTenantFromRequest(request: VercelRequest) {
  const resolved = await resolveTenantFromRequest(request);
  if (!resolved?.tenant) {
    throw new ApiError(
      404,
      "Nenhum tenant foi resolvido para esta requisição. Use um domínio configurado ou envie X-Tenant-Slug.",
    );
  }

  return resolved;
}
