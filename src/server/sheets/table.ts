import { ApiError } from "../http.js";
import { readSheetValues, updateSheetValues } from "../../lib/services/googleSheetsService.js";
import { SHEET_COLUMNS, SheetColumn, SheetName, SheetRecord } from "./schema.js";
import { asString, isBlankRecord } from "./utils.js";

const TABLE_CACHE_TTL_MS = 15_000;
const TABLE_CACHE_STALE_GRACE_MS = 2 * 60_000;

type CachedTableEntry = {
  cachedAt: number;
  expiresAt: number;
  records: SheetRecord<SheetName>[];
};

const tableCache = new Map<SheetName, CachedTableEntry>();
const inflightReads = new Map<SheetName, Promise<SheetRecord<SheetName>[]>>();

function normalizeRecord<T extends SheetName>(sheetName: T, record: Partial<SheetRecord<T>>) {
  const normalized = {} as SheetRecord<T>;
  const columns = SHEET_COLUMNS[sheetName] as readonly SheetColumn<T>[];
  for (const column of columns) {
    normalized[column] = asString(record[column]);
  }
  return normalized;
}

function cloneRecords<T extends SheetName>(records: SheetRecord<T>[]) {
  return records.map((record) => ({ ...record }));
}

function getCachedTable<T extends SheetName>(sheetName: T, allowStale = false) {
  const cached = tableCache.get(sheetName);
  if (!cached) {
    return null;
  }

  const now = Date.now();
  if (!allowStale && cached.expiresAt <= now) {
    return null;
  }

  if (allowStale && cached.cachedAt + TABLE_CACHE_STALE_GRACE_MS <= now) {
    return null;
  }

  return cloneRecords(cached.records as SheetRecord<T>[]);
}

function setCachedTable<T extends SheetName>(sheetName: T, records: SheetRecord<T>[]) {
  const now = Date.now();
  tableCache.set(sheetName, {
    cachedAt: now,
    expiresAt: now + TABLE_CACHE_TTL_MS,
    records: cloneRecords(records) as SheetRecord<SheetName>[],
  });
}

function shouldUseCachedTableOnError(error: unknown) {
  const status = typeof error === "object" && error && "code" in error
    ? Number((error as { code?: unknown }).code)
    : NaN;
  if ([408, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  return /quota|rate limit|too many requests|read requests per minute|timed out|ECONNRESET|ENOTFOUND|EAI_AGAIN|socket hang up/i.test(
    message,
  );
}

async function loadTable<T extends SheetName>(sheetName: T): Promise<SheetRecord<T>[]> {
  const range = `${sheetName}!A:ZZ`;
  const values = await readSheetValues(range);
  const header = (values[0] ?? []).map((value) => String(value));
  const expectedColumns = [...SHEET_COLUMNS[sheetName]];

  if (!header.length) {
    await updateSheetValues(`${sheetName}!A1`, [expectedColumns]);
    setCachedTable(sheetName, []);
    return [];
  }

  const missingColumns = expectedColumns.filter((column) => !header.includes(column));
  if (missingColumns.length > 0) {
    const rawRows = values.slice(1).map((row) =>
      header.reduce((acc, column, index) => {
        acc[column] = asString(row[index]);
        return acc;
      }, {} as Record<string, string>),
    );

    await updateSheetValues(`${sheetName}!A1`, [
      expectedColumns,
      ...rawRows.map((row) => expectedColumns.map((column) => asString(row[column]))),
    ]);

    return loadTable(sheetName);
  }

  const records = values
    .slice(1)
    .map((row) => {
      const rawRecord = header.reduce((acc, column, index) => {
        acc[column] = asString(row[index]);
        return acc;
      }, {} as Record<string, string>);

      return normalizeRecord(sheetName, rawRecord as Partial<SheetRecord<T>>);
    })
    .filter((record) => !isBlankRecord(record));

  setCachedTable(sheetName, records);
  return records;
}

export async function readTable<T extends SheetName>(sheetName: T): Promise<SheetRecord<T>[]> {
  const cached = getCachedTable(sheetName);
  if (cached) {
    return cached;
  }

  const inflight = inflightReads.get(sheetName) as Promise<SheetRecord<T>[]> | undefined;
  if (inflight) {
    return cloneRecords(await inflight);
  }

  const nextRead = loadTable(sheetName)
    .catch((error) => {
      const fallback = getCachedTable(sheetName, true);
      if (fallback && shouldUseCachedTableOnError(error)) {
        console.warn(`[sheets:${sheetName}] Falling back to cached rows after read failure.`, error);
        return fallback;
      }

      throw error;
    })
    .finally(() => {
      inflightReads.delete(sheetName);
    });

  inflightReads.set(sheetName, nextRead as Promise<SheetRecord<SheetName>[]>);
  return cloneRecords(await nextRead);
}

export async function writeTable<T extends SheetName>(sheetName: T, records: Partial<SheetRecord<T>>[]) {
  const columns = [...SHEET_COLUMNS[sheetName]];
  const values = [
    columns,
    ...records.map((record) => {
      const normalized = normalizeRecord(sheetName, record);
      return columns.map((column) => normalized[column]);
    }),
  ];

  await updateSheetValues(`${sheetName}!A1`, values);
  setCachedTable(
    sheetName,
    records.map((record) => normalizeRecord(sheetName, record)),
  );
}

export async function mutateTable<T extends SheetName>(
  sheetName: T,
  mutate: (records: SheetRecord<T>[]) => Promise<SheetRecord<T>[]> | SheetRecord<T>[],
) {
  const currentRecords = await readTable(sheetName);
  const nextRecords = await mutate(currentRecords);
  await writeTable(sheetName, nextRecords);
  return nextRecords;
}
