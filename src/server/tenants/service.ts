import type { Tenant, TenantUser } from "@prisma/client";
import { getPrisma } from "../db/prisma.js";
import { hashPassword } from "../auth/passwords.js";
import { ApiError, getRequestOrigin } from "../http.js";
import { getSettingsMap, mapTypedSettings } from "../sheets/settingsRepo.js";
import { encryptSecret } from "../security/crypto.js";

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

function isLocalHost(host: string) {
  return ["localhost", "127.0.0.1"].includes(host);
}

export async function countTenants() {
  return getPrisma().tenant.count();
}

export async function findTenantBySlug(slug: string) {
  return getPrisma().tenant.findUnique({
    where: { slug: normalizeSlug(slug) },
  });
}

export async function findTenantById(id: string) {
  return getPrisma().tenant.findUnique({
    where: { id },
  });
}

export async function findTenantByHost(host: string) {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return null;

  const domain = await getPrisma().tenantDomain.findUnique({
    where: { host: normalizedHost },
    include: { tenant: true },
  });

  return domain?.tenant ?? null;
}

export async function findTenantUserByEmail(tenantId: string, email: string) {
  return getPrisma().tenantUser.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: email.trim().toLowerCase(),
      },
    },
  });
}

export async function createTenantBootstrap(input: {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminPassword: string;
  host?: string | null;
}) {
  const prisma = getPrisma();
  const slug = normalizeSlug(input.tenantSlug);
  if (!slug) {
    throw new ApiError(400, "Slug do tenant inválido.");
  }

  const email = input.adminEmail.trim().toLowerCase();
  const passwordHash = await hashPassword(input.adminPassword);
  const host = input.host ? normalizeHost(input.host) : null;

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: input.tenantName.trim(),
      users: {
        create: {
          email,
          passwordHash,
          role: "owner",
          status: "active",
        },
      },
      domains:
        host && !isLocalHost(host)
          ? {
              create: {
                host,
                isPrimary: true,
              },
            }
          : undefined,
    },
    include: {
      users: true,
      domains: true,
    },
  });

  const settings = mapTypedSettings(await getSettingsMap());
  if (settings.mp_access_token && settings.mp_user_id) {
    await prisma.mercadoPagoConnection.upsert({
      where: { tenantId: tenant.id },
      update: {
        mercadoPagoUserId: settings.mp_user_id,
        accessTokenEncrypted: encryptSecret(settings.mp_access_token),
        refreshTokenEncrypted: settings.mp_refresh_token
          ? encryptSecret(settings.mp_refresh_token)
          : null,
        status: "connected",
        publicKey: settings.mp_public_key || null,
        connectedAt: new Date(),
        lastError: null,
      },
      create: {
        tenantId: tenant.id,
        mercadoPagoUserId: settings.mp_user_id,
        accessTokenEncrypted: encryptSecret(settings.mp_access_token),
        refreshTokenEncrypted: settings.mp_refresh_token
          ? encryptSecret(settings.mp_refresh_token)
          : null,
        status: "connected",
        publicKey: settings.mp_public_key || null,
        connectedAt: new Date(),
      },
    });
  }

  return {
    tenant,
    tenantUser: tenant.users[0]!,
    origin: getRequestOrigin({
      headers: { host: host || "localhost" },
    } as never),
  };
}

export async function ensureTenantDomain(tenantId: string, host: string, isPrimary = false) {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost || isLocalHost(normalizedHost)) {
    return null;
  }

  return getPrisma().tenantDomain.upsert({
    where: { host: normalizedHost },
    update: {
      tenantId,
      isPrimary,
    },
    create: {
      tenantId,
      host: normalizedHost,
      isPrimary,
    },
  });
}

export async function listTenantDomains(tenantId: string) {
  return getPrisma().tenantDomain.findMany({
    where: { tenantId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

export type TenantRecord = Tenant;
export type TenantUserRecord = TenantUser;
