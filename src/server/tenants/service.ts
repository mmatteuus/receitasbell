import { 
  findTenantBySlug as findBaserowTenantBySlug, 
  findTenantById as findBaserowTenantById,
  findTenantByHost as findBaserowTenantByHost,
  createTenant as createBaserowTenant,
  TenantRecord
} from "../baserow/tenantsRepo.js";
import { findUserByEmail as findBaserowUserByEmail, findOrCreateUserByEmail } from "../baserow/usersRepo.js";
import { hashPassword } from "../auth/passwords.js";
import { ApiError, getRequestOrigin } from "../http.js";
import { getSettingsMap, mapTypedSettings } from "../baserow/settingsRepo.js";
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
  return 1; // Simplificado para Baserow por enquanto
}

export async function findTenantBySlug(slug: string) {
  return findBaserowTenantBySlug(normalizeSlug(slug));
}

export async function findTenantById(id: string | number) {
  return findBaserowTenantById(id);
}

export async function findTenantByHost(host: string) {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return null;
  return findBaserowTenantByHost(normalizedHost);
}

export async function findTenantUserByEmail(tenantId: string | number, email: string) {
  return findBaserowUserByEmail(tenantId, email);
}

export async function createTenantBootstrap(input: {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
  adminPassword: string;
  host?: string | null;
}) {
  const slug = normalizeSlug(input.tenantSlug);
  if (!slug) {
    throw new ApiError(400, "Slug do tenant inválido.");
  }

  const email = input.adminEmail.trim().toLowerCase();
  // No Baserow a senha não é armazenada na tabela de usuários pública usualmente 
  // mas para fins de compatibilidade com a interface de Sessão:
  // (Nota: No Baserow estamos focando em dados, a Auth pode ser via Session/Token)

  const tenant = await createBaserowTenant(input.tenantName.trim(), slug);
  const tenantUser = await findOrCreateUserByEmail(tenant.id, email, "Admin");

  // TODO: Implementar salvamento de conexão Mercado Pago se houver no Baserow
  
  return {
    tenant,
    tenantUser,
    origin: getRequestOrigin({
      headers: { host: (input.host ? normalizeHost(input.host) : "localhost") },
    } as never),
  };
}

export async function ensureTenantDomain(tenantId: string | number, host: string, isPrimary = false) {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost || isLocalHost(normalizedHost)) {
    return null;
  }
  // No Baserow salvamos o host na própria tabela de Tenants ou uma tabela pivot
  // Por enquanto, atualizamos o tenant.
  return null; 
}

export async function listTenantDomains(tenantId: string | number) {
  return []; // Implementação futura se necessário
}

export type { TenantRecord };
export type TenantUserRecord = any;
