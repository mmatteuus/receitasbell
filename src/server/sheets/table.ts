import { ApiError } from "../http.js";
import { readSheetValues, updateSheetValues } from "../../lib/services/googleSheetsService.js";
import { SHEET_COLUMNS, SheetColumn, SheetName, SheetRecord } from "./schema.js";
import { asString, isBlankRecord } from "./utils.js";

function normalizeRecord<T extends SheetName>(sheetName: T, record: Partial<SheetRecord<T>>) {
  const normalized = {} as SheetRecord<T>;
  const columns = SHEET_COLUMNS[sheetName] as readonly SheetColumn<T>[];
  for (const column of columns) {
    normalized[column] = asString(record[column]);
  }
  return normalized;
}

export async function readTable<T extends SheetName>(sheetName: T): Promise<SheetRecord<T>[]> {
  const range = `${sheetName}!A:ZZ`;
  const values = await readSheetValues(range);
  const header = (values[0] ?? []).map((value) => String(value));
  const expectedColumns = [...SHEET_COLUMNS[sheetName]];

  if (!header.length) {
    throw new ApiError(500, `Sheet "${sheetName}" is empty or missing a header row`);
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

    return readTable(sheetName);
  }

  return values
    .slice(1)
    .map((row) => {
      const rawRecord = header.reduce((acc, column, index) => {
        acc[column] = asString(row[index]);
        return acc;
      }, {} as Record<string, string>);

      return normalizeRecord(sheetName, rawRecord as Partial<SheetRecord<T>>);
    })
    .filter((record) => !isBlankRecord(record));
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
