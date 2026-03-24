import { 
  getTenantBySlug, 
  getTenantById,
} from "./repo.js";
import { findUserByEmail, findOrCreateUserByEmail } from "../identity/repo.js";
import { ApiError, getRequestOrigin } from "../../shared/http.js";

export async function findTenantBySlug(slug: string) {
  return getTenantBySlug(slug);
}

export async function findTenantById(id: string | number) {
  return getTenantById(id);
}

export async function findTenantByHost(host: string) {
  // Simulação de busca por host no repo se necessário
  return null; 
}

export async function createTenantBootstrap(input: {
  tenantName: string;
  tenantSlug: string;
  adminEmail: string;
}) {
  // Lógica de bootstrap...
  return null;
}
