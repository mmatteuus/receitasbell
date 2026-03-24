import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeForSpreadsheet } from "../src/server/sheets/sanitizeForSpreadsheet.js";

test("prefixes spreadsheet formulas", () => {
  assert.equal(sanitizeForSpreadsheet("=SUM(A1:A2)"), "'=SUM(A1:A2)");
  assert.equal(sanitizeForSpreadsheet("+1+2"), "'+1+2");
  assert.equal(sanitizeForSpreadsheet(" -1"), "' -1");
});

test("leaves safe values untouched", () => {
  assert.equal(sanitizeForSpreadsheet("hello"), "hello");
  assert.equal(sanitizeForSpreadsheet(""), "");
  assert.equal(sanitizeForSpreadsheet("  text"), "  text");
});

test("handles nullish values", () => {
  assert.equal(sanitizeForSpreadsheet(null), "");
  assert.equal(sanitizeForSpreadsheet(undefined), "");
});
