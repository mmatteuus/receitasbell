import { fetchBaserow, BASEROW_TABLES } from "./client.js";

export interface UserRecord {
  id: string | number;
  email: string;
  username: string;
  displayName: string;
  role: string;
  passwordHash: string;
  status: "active" | "inactive";
  tenantId: string | number;
  createdAt: string;
  updatedAt: string;
}

export async function findUserByEmail(tenantId: string | number, email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.USERS}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__email__equal=${normalized}`
  );
  
  const record = data.results[0];
  if (!record) return null;
  
  return mapUserRowToRecord(record);
}

export async function findOrCreateUserByEmail(tenantId: string | number, email: string, displayName?: string): Promise<UserRecord> {
  const existing = await findUserByEmail(tenantId, email);
  if (existing) return existing;

  const now = new Date().toISOString();
  const normalized = email.trim().toLowerCase();
  
  const record = await fetchBaserow<any>(
    `/api/database/rows/table/${BASEROW_TABLES.USERS}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        email: normalized,
        username: normalized.split("@")[0],
        display_name: displayName || normalized.split("@")[0],
        role: "viewer",
        tenantId: String(tenantId),
        created_at: now,
        updated_at: now,
      }),
    }
  );

  return mapUserRowToRecord(record);
}

function mapUserRowToRecord(row: any): UserRecord {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    role: row.role || "viewer",
    passwordHash: row.password_hash || "",
    status: row.status === "active" ? "active" : "inactive",
    tenantId: row.tenantId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
