import { google, type drive_v3, type sheets_v4 } from "googleapis";
import { getGoogleEnv } from "../../server/env.js";

const SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];
export const OFFICIAL_MVP_SPREADSHEET_ID = "16Bl040rdAjh1NKy4olidNk99F5vrsXIeyn3JeMcKWT4";

let authPromise: Promise<InstanceType<typeof google.auth.JWT>> | null = null;
let sheetsPromise: Promise<sheets_v4.Sheets> | null = null;
let drivePromise: Promise<drive_v3.Drive> | null = null;
const knownSheets = new Set<string>();

function getSheetCacheKey(spreadsheetId: string, sheetName: string) {
  return `${spreadsheetId}:${sheetName}`;
}

function shouldRetryGoogleError(error: unknown) {
  const status = typeof error === "object" && error && "code" in error ? Number((error as { code?: unknown }).code) : NaN;
  if ([408, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  return /timeout|timed out|ECONNRESET|EAI_AGAIN|ENOTFOUND|socket hang up/i.test(message);
}

async function withGoogleRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetryGoogleError(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }

  throw lastError;
}

async function createAuth() {
  const { projectId, clientEmail, privateKey } = getGoogleEnv();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    projectId,
    scopes: SHEETS_SCOPES,
  });

  await auth.authorize();
  return auth;
}

export async function getGoogleAuth() {
  if (!authPromise) {
    authPromise = createAuth();
  }

  return authPromise;
}

export function getSpreadsheetId() {
  return getGoogleEnv().spreadsheetId || OFFICIAL_MVP_SPREADSHEET_ID;
}

export function getDriveFolderId() {
  return process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null;
}

export async function getSheetsClient() {
  if (!sheetsPromise) {
    sheetsPromise = getGoogleAuth().then((auth) =>
      google.sheets({
        version: "v4",
        auth,
      }),
    );
  }

  return sheetsPromise;
}

function getSheetNameFromRange(range: string) {
  const [sheetName] = range.split("!");
  return sheetName?.trim() || null;
}

async function ensureSheetExists(sheetName: string) {
  const spreadsheetId = getSpreadsheetId();
  const cacheKey = getSheetCacheKey(spreadsheetId, sheetName);
  if (knownSheets.has(cacheKey)) {
    return;
  }

  const sheets = await getSheetsClient();
  const metadata = await withGoogleRetry(() =>
    sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties.title",
    }),
  );

  const exists = metadata.data.sheets?.some(
    (sheet) => sheet.properties?.title?.trim() === sheetName,
  );

  if (exists) {
    knownSheets.add(cacheKey);
    return;
  }

  await withGoogleRetry(() =>
    sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    }),
  );
  knownSheets.add(cacheKey);
}

export async function getDriveClient() {
  if (!drivePromise) {
    drivePromise = getGoogleAuth().then((auth) =>
      google.drive({
        version: "v3",
        auth,
      }),
    );
  }

  return drivePromise;
}

export async function readSheetValues(range: string) {
  const sheetName = getSheetNameFromRange(range);
  if (sheetName) {
    await ensureSheetExists(sheetName);
  }

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const response = await withGoogleRetry(() =>
    sheets.spreadsheets.values.get({ spreadsheetId, range }),
  );
  return response.data.values ?? [];
}

export async function updateSheetValues(range: string, values: string[][]) {
  const sheetName = getSheetNameFromRange(range);
  if (sheetName) {
    await ensureSheetExists(sheetName);
  }

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  await withGoogleRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    }),
  );
}

type SheetRow = Record<string, string>;

function mapSheetRows(values: string[][]): SheetRow[] {
  const header = (values[0] ?? []).map((value) => String(value));
  if (!header.length) {
    return [];
  }

  return values.slice(1).map((row) =>
    header.reduce<SheetRow>((acc, column, index) => {
      acc[column] = String(row[index] ?? "");
      return acc;
    }, {}),
  );
}

export async function getRows(sheetName: string) {
  const values = await readSheetValues(`${sheetName}!A:ZZ`);
  return mapSheetRows(values);
}

export async function appendRow(sheetName: string, row: SheetRow) {
  await ensureSheetExists(sheetName);
  const values = await readSheetValues(`${sheetName}!A:ZZ`);
  const header = (values[0] ?? []).map((value) => String(value).trim()).filter(Boolean);
  const headers = header.length > 0 ? header : Object.keys(row);

  if (!headers.length) {
    await updateSheetValues(`${sheetName}!A1`, [
      Object.keys(row),
      Object.values(row).map(String),
    ]);
    return row;
  }

  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await withGoogleRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:ZZ`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [headers.map((header) => String(row[header] ?? ""))],
      },
    }),
  );

  return row;
}

export async function findRowBy(sheetName: string, field: string, value: string) {
  const rows = await getRows(sheetName);
  return rows.find((row) => String(row[field] ?? "") === value) ?? null;
}

export async function listRowsBy(
  sheetName: string,
  filters: Record<string, string | number | boolean | null | undefined>,
) {
  const rows = await getRows(sheetName);
  const activeFilters = Object.entries(filters).filter(([, value]) => value !== undefined);

  if (!activeFilters.length) {
    return rows;
  }

  return rows.filter((row) =>
    activeFilters.every(([field, value]) => String(row[field] ?? "") === String(value ?? "")),
  );
}

export async function updateRow(
  sheetName: string,
  rowId: string,
  patch: Record<string, string | number | boolean | null | undefined>,
) {
  const values = await readSheetValues(`${sheetName}!A:ZZ`);
  const header = (values[0] ?? []).map((value) => String(value));

  if (!header.length) {
    return null;
  }

  const idField = header.includes("id") ? "id" : header.includes("key") ? "key" : null;
  if (!idField) {
    return null;
  }

  const rowIndex = values
    .slice(1)
    .findIndex((row) => String(row[header.indexOf(idField)] ?? "") === rowId);

  if (rowIndex < 0) {
    return null;
  }

  const current = mapSheetRows(values)[rowIndex] ?? {};
  const serializedPatch = Object.entries(patch).reduce<SheetRow>((acc, [key, value]) => {
    acc[key] = value === null || value === undefined ? "" : String(value);
    return acc;
  }, {});
  const next = { ...current, ...serializedPatch };
  const absoluteRowIndex = rowIndex + 2;
  await updateSheetValues(`${sheetName}!A${absoluteRowIndex}`, [
    header.map((column) => String(next[column] ?? "")),
  ]);
  return next;
}
