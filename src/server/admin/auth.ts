import type { VercelRequest, VercelResponse } from "@vercel/node";
import { timingSafeEqual } from "node:crypto";
import { env } from "../shared/env.js";
import { ApiError } from "../shared/http.js";
import { Logger } from "../shared/logger.js";
import { countTenants } from "../tenancy/repo.js";
import { createTenantBootstrap } from "../tenancy/service.js";
import { requireTenantFromRequest } from "../tenancy/resolver.js";
import { getSession, createSession, revokeSession } from "../auth/sessions.js";
import { auditLog } from "../audit/service.js";
import { assertStrongAdminPassword, hashAdminPassword, verifyAdminPasswordHash } from "../auth/passwords.js";
import { findUserByEmailForTenant, updateUserPasswordCredentials } from "../identity/repo.js";

export type AdminSessionResponse = {
  authenticated: boolean;
  mode: "bootstrap" | "tenant";
  bootstrapRequired: boolean;
  tenant: { id: string; slug: string; name: string } | null;
  user: { id: string; email: string; role: string } | null;
};

function hasAdminRole(role: string | undefined): role is "admin" | "owner" {
  return role === "admin" || role === "owner";
}

function safeStringEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function formatAdminSessionResponse(input: {
  authenticated: boolean;
  mode: "bootstrap" | "tenant";
  bootstrapRequired: boolean;
  tenant?: { id: string | number; slug: string; name: string } | null;
  user?: { id: string | number; email: string; role: string } | null;
}): AdminSessionResponse {
  return {
    authenticated: input.authenticated,
    mode: input.mode,
    bootstrapRequired: input.bootstrapRequired,
    tenant: input.tenant
      ? { id: String(input.tenant.id), slug: input.tenant.slug, name: input.tenant.name }
      : null,
    user: input.user
      ? { id: String(input.user.id), email: input.user.email, role: input.user.role }
      : null,
  };
}

export async function readAdminSession(request: VercelRequest): Promise<AdminSessionResponse> {
  const tenantCount = await countTenants();
  const session = await getSession(request);
  const isAdmin = Boolean(session && hasAdminRole(session.role));

  if (tenantCount === 0) {
    return formatAdminSessionResponse({
      authenticated: isAdmin,
      mode: "bootstrap",
      bootstrapRequired: true,
      user: isAdmin
        ? { id: session!.userId, email: session!.email, role: session!.role }
        : null,
    });
  }

  let resolvedTenant: { id: string; slug: string; name: string } | null = null;
  try {
    const { tenant } = await requireTenantFromRequest(request);
    resolvedTenant = { id: String(tenant.id), slug: tenant.slug, name: tenant.name };
  } catch {
    resolvedTenant = null;
  }

  return formatAdminSessionResponse({
    authenticated: isAdmin,
    mode: "tenant",
    bootstrapRequired: false,
    tenant: resolvedTenant,
    user: isAdmin && session
      ? { id: session.userId, email: session.email, role: session.role }
      : null,
  });
}

export async function loginAdmin(
  request: VercelRequest,
  response: VercelResponse,
  input: { email?: string; password?: string },
  options: { logger?: Logger } = {},
): Promise<AdminSessionResponse> {
  const tenantCount = await countTenants();
  const logger = options.logger ?? Logger.fromRequest(request);

  if (tenantCount === 0) {
    const bootstrapSecret = env.ADMIN_API_SECRET || "";
    if (!bootstrapSecret) {
      throw new ApiError(500, "ADMIN_API_SECRET is required for bootstrap mode");
    }
    assertStrongAdminPassword(bootstrapSecret, "ADMIN_API_SECRET");

    if (!input.password || !safeStringEquals(input.password, bootstrapSecret)) {
      logger.warn("admin.login_failed", {
        action: "admin.login_failed",
        reason: "password_invalid",
        mode: "bootstrap",
      });
      throw new ApiError(401, "Invalid bootstrap password");
    }

    await createSession(request, response, {
      tenantId: "system",
      userId: "bootstrap-owner",
      email: "owner@system.local",
      role: "owner",
    });

    return formatAdminSessionResponse({
      mode: "bootstrap" as const,
      authenticated: true,
      bootstrapRequired: true,
      user: { id: "bootstrap-owner", email: "owner@system.local", role: "owner" },
    });
  }

  let tenant: { id: string | number; slug: string; name: string };
  try {
    ({ tenant } = await requireTenantFromRequest(request));
  } catch (error) {
    logger.warn("admin.login_failed", {
      action: "admin.login_failed",
      reason: "tenant_resolution_failed",
    });
    throw error;
  }
  const email = input.email?.trim().toLowerCase();
  const password = input.password;
  if (!email || !password) {
    throw new ApiError(400, "Email and password required");
  }

  const user = await findUserByEmailForTenant(
    { id: String(tenant.id), slug: tenant.slug, name: tenant.name },
    email,
  );
  if (!user || !hasAdminRole(user.role)) {
    logger.warn("admin.login_failed", {
      action: "admin.login_failed",
      reason: "user_not_found_or_not_admin",
      tenantId: String(tenant.id),
    });
    throw new ApiError(401, "Invalid credentials or insufficient permissions");
  }
  if (user.status === "inactive") {
    logger.warn("admin.login_failed", {
      action: "admin.login_failed",
      reason: "user_inactive",
      tenantId: String(tenant.id),
      userId: String(user.id),
    });
    throw new ApiError(403, "Inactive administrator");
  }

  let authenticated = false;

  if (user.passwordHash) {
    authenticated = await verifyAdminPasswordHash(password, user.passwordHash);
  } else if (user.legacyPassword && safeStringEquals(password, user.legacyPassword)) {
    assertStrongAdminPassword(password, "senha do admin");
    const passwordHash = await hashAdminPassword(password);
    await updateUserPasswordCredentials({
      userId: user.id,
      passwordHash,
      legacyPassword: "",
    });
    authenticated = true;
  }

  if (!authenticated) {
    logger.warn("admin.login_failed", {
      action: "admin.login_failed",
      reason: "password_invalid",
      tenantId: String(tenant.id),
      userId: String(user.id),
    });
    throw new ApiError(401, "Invalid password");
  }

  const role = user.role === "owner" ? "owner" : "admin";
  await createSession(request, response, {
    tenantId: String(tenant.id),
    userId: String(user.id),
    email: user.email,
    role,
  });

  await auditLog({
    tenantId: String(tenant.id),
    actorType: "admin",
    actorId: String(user.id),
    action: "admin.login",
    resourceType: "session",
    resourceId: String(user.id),
    payload: { email: user.email, role },
  });

  return formatAdminSessionResponse({
    authenticated: true,
    mode: "tenant",
    bootstrapRequired: false,
    tenant,
    user: { id: user.id, email: user.email, role },
  });
}

export async function logoutAdmin(request: VercelRequest, response: VercelResponse) {
  await revokeSession(request, response);
  return { authenticated: false };
}

export async function bootstrapTenantAdmin(
  request: VercelRequest,
  response: VercelResponse,
  input: { tenantName?: string; tenantSlug?: string; adminEmail?: string; adminPassword?: string },
): Promise<AdminSessionResponse> {
  const tenantCount = await countTenants();
  if (tenantCount > 0) {
    throw new ApiError(409, "Bootstrap is only available before the first tenant is created");
  }

  const session = await getSession(request);
  if (!session || session.role !== "owner" || session.tenantId !== "system") {
    throw new ApiError(401, "Bootstrap owner session required");
  }

  const adminPassword = input.adminPassword || "";
  assertStrongAdminPassword(adminPassword, "senha inicial do admin");
  const adminPasswordHash = await hashAdminPassword(adminPassword);

  const { tenant, adminUser } = await createTenantBootstrap({
    tenantName: input.tenantName || "",
    tenantSlug: input.tenantSlug || "",
    adminEmail: input.adminEmail || "",
    adminDisplayName: input.adminEmail?.split("@")[0] || "",
    adminPasswordHash,
  });

  await revokeSession(request, response);
  await createSession(request, response, {
    tenantId: String(tenant.id),
    userId: String(adminUser.id),
    email: adminUser.email,
    role: "owner",
  });

  await auditLog({
    tenantId: String(tenant.id),
    actorType: "system",
    actorId: "bootstrap-owner",
    action: "admin.bootstrap",
    resourceType: "tenant",
    resourceId: String(tenant.id),
    payload: {
      tenantSlug: tenant.slug,
      adminEmail: adminUser.email,
      role: "owner",
    },
  });

  return formatAdminSessionResponse({
    authenticated: true,
    mode: "tenant",
    bootstrapRequired: false,
    tenant,
    user: { id: adminUser.id, email: adminUser.email, role: "owner" },
  });
}
