import { SheetRecord } from "./schema.js";
import { mutateTable, readTable } from "./table.js";
import { createUniqueSlug, nowIso } from "./utils.js";

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

function mapUser(row: SheetRecord<"users">): UserRecord {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    role: row.role || "viewer",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildUserRow(args: {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}): SheetRecord<"users"> {
  return {
    id: args.id,
    email: args.email,
    username: args.username,
    display_name: args.displayName ?? "",
    password_hash: "",
    role: args.role ?? "viewer",
    avatar_url: "",
    created_at: args.createdAt,
    updated_at: args.updatedAt,
    disabled_at: "",
    must_change_password: "false",
    password_updated_at: "",
    last_login_at: "",
  };
}

async function listUserRows() {
  return readTable("users");
}

export async function listUsers() {
  const rows = await listUserRows();
  return rows.map(mapUser);
}

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const rows = await listUserRows();
  const match = rows.find((row) => row.email.trim().toLowerCase() === normalized);
  return match ? mapUser(match) : null;
}

export async function findOrCreateUserByEmail(email: string, displayName?: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalized);
  if (existing) {
    return existing;
  }

  const now = nowIso();
  const id = crypto.randomUUID();

  const createdRows = await mutateTable("users", async (rows) => {
    const usernames = rows.map((row) => row.username);
    const username = createUniqueSlug(normalized.split("@")[0], usernames);
    const nextRow = buildUserRow({
      id,
      email: normalized,
      username,
      displayName,
      createdAt: now,
      updatedAt: now,
    });
    return [...rows, nextRow];
  });

  const created = createdRows.find((row) => row.id === id)!;
  return mapUser(created);
}
