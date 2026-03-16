export function sanitizeForSpreadsheet(value) {
  if (value === null || value === undefined || value === "") {
    return value ?? "";
  }

  const trimmedStart = value.trimStart();
  if (!trimmedStart) {
    return value;
  }

  const dangerChars = ["=", "+", "-", "@", "\t"];
  if (dangerChars.includes(trimmedStart[0])) {
    return "'" + value;
  }

  return value;
}
