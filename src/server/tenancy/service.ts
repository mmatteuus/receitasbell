import { 
  getTenantBySlug, 
  getTenantById,
  getTenantByHost,
  createTenant,
} from "./repo.js";
import { createUser } from "../identity/repo.js";
import { ApiError } from "../shared/http.js";

export async function findTenantBySlug(slug: string) {
  return getTenantBySlug(slug);
}

export async function findTenantById(id: string | number) {
  return getTenantById(id);
}

export async function findTenantByHost(host: string) {
  return getTenantByHost(host);
}

function normalizeTenantSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createTenantBootstrap(input: {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminDisplayName?: string;
  adminPasswordHash: string;
}) {
  const tenantName = input.tenantName.trim();
  const tenantSlug = normalizeTenantSlug(input.tenantSlug);
  const adminEmail = input.adminEmail.trim().toLowerCase();

  if (!tenantName) {
    throw new ApiError(400, "Tenant name required");
  }
  if (!tenantSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenantSlug)) {
    throw new ApiError(400, "Tenant slug must use lowercase letters, numbers, and hyphens");
  }
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new ApiError(400, "Valid admin email required");
  }

  const existingTenant = await getTenantBySlug(tenantSlug);
  if (existingTenant) {
    throw new ApiError(409, "Tenant slug already exists");
  }

  const tenant = await createTenant({
    slug: tenantSlug,
    name: tenantName,
  });

  const adminUser = await createUser({
    tenantId: tenant.id,
    email: adminEmail,
    displayName: input.adminDisplayName || adminEmail.split("@")[0],
    role: "owner",
    status: "active",
    passwordHash: input.adminPasswordHash,
  });

  return { tenant, adminUser };
}
