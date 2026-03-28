import { fetchBaserow } from "../integrations/baserow/client.js";
import { BASEROW_TABLES } from "../integrations/baserow/tables.js";

type UserRow = {
  id?: string | number;
  email?: string;
  username?: string;
  display_name?: string;
  role?: string;
  password_hash?: string;
  password?: string;
  status?: string;
  tenantId?: string | number;
  tenant_id?: string | number;
  created_at?: string;
  updated_at?: string;
};

export interface UserRecord {
  id: string | number;
  email: string;
  username: string;
  displayName: string;
  role: string;
  passwordHash: string;
  legacyPassword: string;
  status: "active" | "inactive";
  tenantId: string | number;
  createdAt: string;
  updatedAt: string;
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function mapUserRowToRecord(row: UserRow): UserRecord {
  let role = row.role || "viewer";
  if (role === "administrador") role = "admin";

  return {
    id: row.id ?? "",
    email: row.email ?? "",
    username: row.username ?? "",
    displayName: row.display_name ?? "",
    role,
    passwordHash: row.password_hash || "",
    legacyPassword: row.password || "",
    status: row.status === "inactive" ? "inactive" : "active",
    tenantId: row.tenantId ?? row.tenant_id ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

async function findUserByEmailByTenantId(tenantId: string | number, email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const data = await fetchBaserow<{ results: UserRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.USERS}/?user_field_names=true&filter__tenantId__equal=${encodeURIComponent(String(tenantId))}&filter__email__equal=${encodeURIComponent(normalizedEmail)}`
  );

  const record = data.results[0];
  if (!record) return null;

  return mapUserRowToRecord(record);
}

export async function findUserByEmailForTenant(
  tenant: { id: string | number; slug: string; name: string },
  email: string,
): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const data = await fetchBaserow<{ results: UserRow[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.USERS}/?user_field_names=true&filter__email__equal=${encodeURIComponent(normalizedEmail)}`
  );

  const acceptedTenantKeys = new Set([
    normalize(tenant.id),
    normalize(tenant.slug),
    normalize(tenant.name),
  ]);

  const matched = data.results.find((row) => {
    const candidateKeys = [
      normalize(row.tenantId),
      normalize(row.tenant_id),
    ].filter(Boolean);

    return candidateKeys.some((candidate) => acceptedTenantKeys.has(candidate));
  });

  if (!matched) return null;
  return mapUserRowToRecord(matched);
}

export async function createUser(input: {
  tenantId: string | number;
  email: string;
  displayName?: string;
  role?: "viewer" | "admin" | "owner";
  status?: "active" | "inactive";
  passwordHash?: string;
  legacyPassword?: string;
}) {
  const now = new Date().toISOString();
  const normalized = input.email.trim().toLowerCase();

  const record = await fetchBaserow<UserRow>(
    `/api/database/rows/table/${BASEROW_TABLES.USERS}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        email: normalized,
        username: normalized.split("@")[0],
        display_name: input.displayName || normalized.split("@")[0],
        role: input.role || "viewer",
        status: input.status || "active",
        tenantId: String(input.tenantId),
        password_hash: input.passwordHash || "",
        password: input.legacyPassword || "",
        created_at: now,
        updated_at: now,
      }),
    }
  );

  return mapUserRowToRecord(record);
}

export async function findOrCreateUserByEmail(tenantId: string | number, email: string, displayName?: string): Promise<UserRecord> {
  const existing = await findUserByEmailByTenantId(tenantId, email);
  if (existing) return existing;

  return createUser({
    tenantId,
    email,
    displayName,
  });
}

export async function updateUserPasswordCredentials(input: {
  userId: string | number;
  passwordHash?: string;
  legacyPassword?: string;
}) {
  const now = new Date().toISOString();
  const record = await fetchBaserow<UserRow>(
    `/api/database/rows/table/${BASEROW_TABLES.USERS}/${input.userId}/?user_field_names=true`,
    {
      method: "PATCH",
      body: JSON.stringify({
        password_hash: input.passwordHash ?? "",
        password: input.legacyPassword ?? "",
        updated_at: now,
      }),
    },
  );

  return mapUserRowToRecord(record);
}
