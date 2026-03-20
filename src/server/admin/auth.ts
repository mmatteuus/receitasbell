import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPrisma, isDatabaseConfigured } from "../db/prisma.js";
import { getAdminApiSecret } from "../env.js";
import { consumeAdminRateLimit } from "../rateLimit.js";
import {
  clearTenantAdminSessionCookie,
  createTenantAdminSession,
  getTenantAdminSessionContext,
  revokeTenantAdminSession,
  setTenantAdminSessionCookie,
} from "../auth/sessions.js";
import { verifyPassword } from "../auth/passwords.js";
import { countTenants, createTenantBootstrap, findTenantUserByEmail } from "../tenants/service.js";
import { resolveTenantFromRequest } from "../tenants/resolver.js";
import {
  ApiError,
  clearAdminSessionCookie,
  getRequestOrigin,
  hasAdminAccess,
  setAdminSessionCookie,
} from "../http.js";

type TenantSummary = {
  id: string;
  slug: string;
  name: string;
};

type TenantUserSummary = {
  id: string;
  email: string;
  role: string;
};

export type AdminSessionResponse = {
  authenticated: boolean;
  databaseConfigured: boolean;
  mode: "legacy" | "bootstrap" | "tenant";
  bootstrapRequired: boolean;
  legacyAdminAuthenticated: boolean;
  tenantResolved: boolean;
  tenant: TenantSummary | null;
  user: TenantUserSummary | null;
};

type AdminLoginInput = {
  email?: string;
  password?: string;
};

type AdminBootstrapInput = {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminPassword: string;
  host?: string | null;
};

function buildTenantSummary(tenant: { id: string; slug: string; name: string } | null) {
  if (!tenant) return null;
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
  };
}

function buildUserSummary(user: { id: string; email: string; role: string } | null) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

function getClientAddress(request: VercelRequest) {
  const forwarded = request.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.split(",")[0]?.trim() || "unknown";
  }
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.socket.remoteAddress || "unknown";
}

function assertLegacyAdminPassword(password: string | undefined) {
  const normalized = password?.trim();
  if (!normalized) {
    throw new ApiError(400, "Senha do admin legado obrigatoria.");
  }
  if (normalized !== getAdminApiSecret()) {
    throw new ApiError(401, "Senha do admin invalida.");
  }
}

async function ensureLoginRateLimit(request: VercelRequest) {
  const limit = await consumeAdminRateLimit(`admin-login:${getClientAddress(request)}`);
  if (!limit.success) {
    throw new ApiError(429, "Muitas tentativas de login. Tente novamente em instantes.", {
      resetAfter: limit.resetAfter,
    });
  }
}

export async function readAdminSession(request: VercelRequest): Promise<AdminSessionResponse> {
  if (!isDatabaseConfigured()) {
    const authenticated = hasAdminAccess(request);
    return {
      authenticated,
      databaseConfigured: false,
      mode: "legacy",
      bootstrapRequired: false,
      legacyAdminAuthenticated: authenticated,
      tenantResolved: false,
      tenant: null,
      user: null,
    };
  }

  const tenantCount = await countTenants();
  if (tenantCount === 0) {
    return {
      authenticated: false,
      databaseConfigured: true,
      mode: "bootstrap",
      bootstrapRequired: true,
      legacyAdminAuthenticated: hasAdminAccess(request),
      tenantResolved: false,
      tenant: null,
      user: null,
    };
  }

  const [resolvedTenant, sessionContext] = await Promise.all([
    resolveTenantFromRequest(request),
    getTenantAdminSessionContext(request),
  ]);

  const tenant = resolvedTenant?.tenant ?? sessionContext?.tenant ?? null;
  const sessionMatchesTenant =
    !resolvedTenant?.tenant || !sessionContext?.tenant || resolvedTenant.tenant.id === sessionContext.tenant.id;
  const authenticated = Boolean(sessionContext && sessionMatchesTenant);

  return {
    authenticated,
    databaseConfigured: true,
    mode: "tenant",
    bootstrapRequired: false,
    legacyAdminAuthenticated: false,
    tenantResolved: Boolean(tenant),
    tenant: buildTenantSummary(tenant),
    user: authenticated ? buildUserSummary(sessionContext?.tenantUser ?? null) : null,
  };
}

export async function loginAdmin(
  request: VercelRequest,
  response: VercelResponse,
  input: AdminLoginInput,
) {
  await ensureLoginRateLimit(request);

  if (!isDatabaseConfigured()) {
    assertLegacyAdminPassword(input.password);
    setAdminSessionCookie(request, response, getAdminApiSecret());
    return {
      authenticated: true,
      databaseConfigured: false,
      mode: "legacy" as const,
      bootstrapRequired: false,
      legacyAdminAuthenticated: true,
      tenantResolved: false,
      tenant: null,
      user: null,
    };
  }

  const tenantCount = await countTenants();
  if (tenantCount === 0) {
    assertLegacyAdminPassword(input.password);
    setAdminSessionCookie(request, response, getAdminApiSecret());
    return {
      authenticated: false,
      databaseConfigured: true,
      mode: "bootstrap" as const,
      bootstrapRequired: true,
      legacyAdminAuthenticated: true,
      tenantResolved: false,
      tenant: null,
      user: null,
    };
  }

  const resolved = await resolveTenantFromRequest(request);
  if (!resolved?.tenant) {
    throw new ApiError(
      400,
      "Nao foi possivel identificar o tenant deste admin. Acesse pelo dominio do cliente ou pela rota /t/{slug}/admin/login.",
    );
  }

  const email = input.email?.trim().toLowerCase();
  const password = input.password?.trim();
  if (!email || !password) {
    throw new ApiError(400, "Email e senha sao obrigatorios.");
  }

  const tenantUser = await findTenantUserByEmail(resolved.tenant.id, email);
  if (!tenantUser || tenantUser.status !== "active") {
    throw new ApiError(401, "Credenciais invalidas.");
  }

  const validPassword = await verifyPassword(password, tenantUser.passwordHash);
  if (!validPassword) {
    throw new ApiError(401, "Credenciais invalidas.");
  }

  await getPrisma().tenantUser.update({
    where: { id: tenantUser.id },
    data: { lastLoginAt: new Date() },
  });

  const session = await createTenantAdminSession({
    tenantId: resolved.tenant.id,
    tenantUserId: tenantUser.id,
  });

  clearAdminSessionCookie(request, response);
  setTenantAdminSessionCookie(request, response, session.token, session.expiresAt);

  return {
    authenticated: true,
    databaseConfigured: true,
    mode: "tenant" as const,
    bootstrapRequired: false,
    legacyAdminAuthenticated: false,
    tenantResolved: true,
    tenant: buildTenantSummary(resolved.tenant),
    user: buildUserSummary(tenantUser),
  };
}

export async function bootstrapTenantAdmin(
  request: VercelRequest,
  response: VercelResponse,
  input: AdminBootstrapInput,
) {
  if (!isDatabaseConfigured()) {
    throw new ApiError(501, "DATABASE_URL nao configurada para bootstrap multi-tenant.");
  }

  if (await countTenants()) {
    throw new ApiError(409, "Bootstrap inicial ja foi concluido.");
  }

  if (!hasAdminAccess(request)) {
    throw new ApiError(401, "Autenticacao legado obrigatoria para criar o primeiro tenant.");
  }

  const host =
    input.host?.trim() ||
    new URL(getRequestOrigin(request)).host.replace(/:\d+$/, "");

  const created = await createTenantBootstrap({
    tenantName: input.tenantName,
    tenantSlug: input.tenantSlug,
    adminEmail: input.adminEmail,
    adminPassword: input.adminPassword,
    host,
  });

  const session = await createTenantAdminSession({
    tenantId: created.tenant.id,
    tenantUserId: created.tenantUser.id,
  });

  clearAdminSessionCookie(request, response);
  setTenantAdminSessionCookie(request, response, session.token, session.expiresAt);

  return {
    authenticated: true,
    databaseConfigured: true,
    mode: "tenant" as const,
    bootstrapRequired: false,
    legacyAdminAuthenticated: false,
    tenantResolved: true,
    tenant: buildTenantSummary(created.tenant),
    user: buildUserSummary(created.tenantUser),
  };
}

export async function logoutAdmin(request: VercelRequest, response: VercelResponse) {
  if (isDatabaseConfigured()) {
    await revokeTenantAdminSession(request).catch(() => undefined);
  }

  clearTenantAdminSessionCookie(request, response);
  clearAdminSessionCookie(request, response);

  return {
    authenticated: false,
    databaseConfigured: isDatabaseConfigured(),
    mode: isDatabaseConfigured() ? ("tenant" as const) : ("legacy" as const),
    bootstrapRequired: false,
    legacyAdminAuthenticated: false,
    tenantResolved: false,
    tenant: null,
    user: null,
  };
}
