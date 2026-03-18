export function roundBRL(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(roundBRL(value));
}

export function parseBRLInput(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? roundBRL(value) : null;
  }

  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/\s+/g, "")
    .replace(/^R\$/i, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? roundBRL(parsed) : null;
}

export function normalizeBRLInput(value: string | number | null | undefined) {
  const parsed = parseBRLInput(value);
  if (parsed === null) {
    return "";
  }

  return parsed.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function sumBRL(values: Array<number | null | undefined>) {
  return roundBRL(values.reduce((sum, value) => sum + (value ?? 0), 0));
}
