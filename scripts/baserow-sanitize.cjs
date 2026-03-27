#!/usr/bin/env node

const { createHash, randomBytes, scryptSync } = require("node:crypto");
const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ARCHIVE_DUPLICATES = args.includes("--archive-duplicates");
const ALLOW_WEAK_MIGRATION = args.includes("--allow-weak-password-migration");
const REPORT_PATH = readFlagValue("--report") || "docs/operations/baserow-sanitization-report.json";
const CLI_API_URL = readFlagValue("--api-url");
const CLI_DATABASE_ID = readFlagValue("--database-id");
const CLI_API_TOKEN = readFlagValue("--api-token");
const CLI_JWT = readFlagValue("--jwt");
const CLI_EMAIL = readFlagValue("--email");
const CLI_PASSWORD = readFlagValue("--password");

const BASE_URL = (CLI_API_URL || process.env.BASEROW_API_URL || "https://api.baserow.io").replace(/\/+$/, "");
const DATABASE_ID = String(CLI_DATABASE_ID || process.env.BASEROW_DATABASE_ID || "").trim();
if (!DATABASE_ID) {
  throw new Error("Missing required BASEROW_DATABASE_ID (or --database-id).");
}
const MIN_PASSWORD_LENGTH = 10;

function readFlagValue(flag) {
  const idx = args.indexOf(flag);
  if (idx < 0) return "";
  return String(args[idx + 1] || "").trim();
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseId(value) {
  const num = Number(String(value || "").trim());
  return Number.isFinite(num) ? num : null;
}

function getCanonicalIdsFromEnv() {
  const envToDomain = {
    BASEROW_TABLE_TENANTS: "tenants",
    BASEROW_TABLE_USERS: "users",
    BASEROW_TABLE_TENANT_USERS: "tenant_users",
    BASEROW_TABLE_RECIPES: "recipes",
    BASEROW_TABLE_CATEGORIES: "categories",
    BASEROW_TABLE_SETTINGS: "settings",
    BASEROW_TABLE_PAYMENT_ORDERS: "payment_orders",
    BASEROW_TABLE_PAYMENT_EVENTS: "payment_events",
    BASEROW_TABLE_RECIPE_PURCHASES: "recipe_purchases",
    BASEROW_TABLE_AUDIT_LOGS: "audit_logs",
    BASEROW_TABLE_SESSIONS: "sessions",
    BASEROW_TABLE_MAGIC_LINKS: "magic_links",
    BASEROW_TABLE_MP_CONNECTIONS: "mp_connections",
    BASEROW_TABLE_OAUTH_STATES: "oauth_states",
  };

  const out = {};
  for (const [key, domain] of Object.entries(envToDomain)) {
    const parsed = parseId(process.env[key]);
    if (parsed) out[domain] = parsed;
  }
  return out;
}

function commonWeakPasswords() {
  return new Set([
    "123456",
    "1234567",
    "12345678",
    "123456789",
    "1234567890",
    "password",
    "password123",
    "admin",
    "admin123",
    "qwerty",
    "qwerty123",
    "abc123",
    "letmein",
  ]);
}

function passwordStrengthIssues(password) {
  const value = String(password || "");
  const issues = [];
  const weakList = commonWeakPasswords();

  if (value.length < MIN_PASSWORD_LENGTH) {
    issues.push(`min_${MIN_PASSWORD_LENGTH}_chars`);
  }
  if (/\s/.test(value)) {
    issues.push("contains_spaces");
  }
  const classes = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
  if (classes < 3) {
    issues.push("insufficient_character_variety");
  }
  if (/(.)\1{3,}/.test(value)) {
    issues.push("repeated_chars");
  }
  if (weakList.has(value.toLowerCase())) {
    issues.push("common_weak_password");
  }

  return issues;
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

async function getAuthHeader() {
  const token = String(CLI_API_TOKEN || process.env.BASEROW_API_TOKEN || "").trim();
  if (token) {
    return `Token ${token}`;
  }

  const jwt = String(CLI_JWT || process.env.BASEROW_JWT || "").trim();
  if (jwt) {
    return `JWT ${jwt}`;
  }

  const email = String(CLI_EMAIL || process.env.BASEROW_EMAIL || "").trim();
  const password = String(CLI_PASSWORD || process.env.BASEROW_PASSWORD || "").trim();
  if (!email || !password) {
    throw new Error("Provide BASEROW_API_TOKEN/--api-token or BASEROW_EMAIL+BASEROW_PASSWORD / --email+--password.");
  }

  const authResponse = await fetch(`${BASE_URL}/api/user/token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const authData = await authResponse.json();
  const authToken = String(authData?.token || "");
  if (!authResponse.ok || !authToken) {
    throw new Error(`Failed to authenticate in Baserow (status ${authResponse.status}).`);
  }
  return `JWT ${authToken}`;
}

async function requestJson(authHeader, route, init = {}) {
  const response = await fetch(`${BASE_URL}${route}`, {
    ...init,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = `Baserow HTTP ${response.status} at ${route}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = data;
    throw error;
  }
  return data;
}

async function listRows(authHeader, tableId, pageSize = 200) {
  const rows = [];
  let page = 1;

  while (true) {
    const data = await requestJson(
      authHeader,
      `/api/database/rows/table/${tableId}/?user_field_names=true&size=${pageSize}&page=${page}`,
    );
    const currentRows = Array.isArray(data?.results) ? data.results : [];
    rows.push(...currentRows);

    if (!data?.next) break;
    page += 1;
  }

  return rows;
}

async function renameDuplicateTables(authHeader, tables, canonicalIds) {
  const groups = new Map();
  for (const table of tables) {
    const key = normalizeName(table.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(table);
  }

  const archived = [];
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  for (const groupTables of groups.values()) {
    if (groupTables.length <= 1) continue;
    for (const table of groupTables) {
      if (canonicalIds.has(table.id)) continue;
      const nextName = `archived_${stamp}__${normalizeName(table.name)}__${table.id}`;
      await requestJson(authHeader, `/api/database/tables/${table.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ name: nextName }),
      });
      archived.push({ id: table.id, previousName: table.name, name: nextName });
    }
  }

  return archived;
}

function buildSummary(input) {
  const byNormalizedName = {};
  for (const table of input.tables) {
    const key = normalizeName(table.name);
    byNormalizedName[key] = byNormalizedName[key] || [];
    byNormalizedName[key].push({ id: table.id, name: table.name, count: table.count });
  }

  const duplicateGroups = Object.entries(byNormalizedName)
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({ normalizedName: key, tables: group }));

  return {
    tableCount: input.tables.length,
    canonicalByEnv: input.canonicalByEnv,
    duplicateGroups,
  };
}

async function main() {
  const authHeader = await getAuthHeader();
  const canonicalByEnv = getCanonicalIdsFromEnv();
  const canonicalIdSet = new Set(Object.values(canonicalByEnv));

  const tables = await requestJson(authHeader, `/api/database/tables/database/${DATABASE_ID}/`);
  const tableInfos = [];
  for (const table of tables) {
    const [fields, rowSummary] = await Promise.all([
      requestJson(authHeader, `/api/database/fields/table/${table.id}/`),
      requestJson(authHeader, `/api/database/rows/table/${table.id}/?user_field_names=true&size=1`),
    ]);

    tableInfos.push({
      id: table.id,
      name: table.name,
      order: table.order,
      count: Number(rowSummary?.count || 0),
      fieldNames: Array.isArray(fields) ? fields.map((field) => field.name) : [],
    });
  }

  const summary = buildSummary({ tables: tableInfos, canonicalByEnv });

  const usersTableId = canonicalByEnv.users || (() => {
    const byName = tableInfos.find((table) => normalizeName(table.name) === "users");
    return byName ? byName.id : null;
  })();

  const passwordMigration = {
    usersTableId,
    passwordHashFieldCreated: false,
    migratedUsers: [],
    skippedWeakUsers: [],
  };

  if (usersTableId) {
    const usersFields = await requestJson(authHeader, `/api/database/fields/table/${usersTableId}/`);
    const hasPasswordHashField = usersFields.some((field) => field.name === "password_hash");
    const hasLegacyPasswordField = usersFields.some((field) => field.name === "password");

    if (APPLY && !hasPasswordHashField) {
      await requestJson(authHeader, `/api/database/fields/table/${usersTableId}/`, {
        method: "POST",
        body: JSON.stringify({
          name: "password_hash",
          type: "long_text",
        }),
      });
      passwordMigration.passwordHashFieldCreated = true;
    }

    if (hasLegacyPasswordField) {
      const rows = await listRows(authHeader, usersTableId);
      for (const row of rows) {
        const legacyPassword = String(row.password || "");
        if (!legacyPassword) continue;

        const issues = passwordStrengthIssues(legacyPassword);
        const canMigrate = issues.length === 0 || ALLOW_WEAK_MIGRATION;
        if (!canMigrate) {
          passwordMigration.skippedWeakUsers.push({
            id: row.id,
            email: row.email || "",
            issues,
          });
          continue;
        }

        if (APPLY) {
          const passwordHash = hashPassword(legacyPassword);
          await requestJson(authHeader, `/api/database/rows/table/${usersTableId}/${row.id}/?user_field_names=true`, {
            method: "PATCH",
            body: JSON.stringify({
              password_hash: passwordHash,
              password: "",
            }),
          });
        }

        passwordMigration.migratedUsers.push({
          id: row.id,
          email: row.email || "",
          weakPasswordMigrated: issues.length > 0,
        });
      }
    }
  }

  let archivedDuplicates = [];
  if (APPLY && ARCHIVE_DUPLICATES) {
    archivedDuplicates = await renameDuplicateTables(authHeader, tableInfos, canonicalIdSet);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: {
      apply: APPLY,
      archiveDuplicates: ARCHIVE_DUPLICATES,
      allowWeakPasswordMigration: ALLOW_WEAK_MIGRATION,
    },
    databaseId: DATABASE_ID,
    summary,
    passwordMigration,
    archivedDuplicates,
    tables: tableInfos,
  };

  const absoluteReportPath = path.resolve(process.cwd(), REPORT_PATH);
  mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
  writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const digest = createHash("sha256").update(JSON.stringify(report)).digest("hex").slice(0, 12);
  console.log(`Baserow sanitization report saved to: ${absoluteReportPath}`);
  console.log(`Summary: ${summary.tableCount} tables, ${summary.duplicateGroups.length} duplicate-name group(s).`);
  console.log(
    `Password migration: ${passwordMigration.migratedUsers.length} migrated, ${passwordMigration.skippedWeakUsers.length} weak row(s) pending.`,
  );
  console.log(`Report digest: ${digest}`);
}

main().catch((error) => {
  const details = error?.body ? ` details=${JSON.stringify(error.body)}` : "";
  console.error(`baserow-sanitize failed: ${error.message || String(error)}${details}`);
  process.exit(1);
});
