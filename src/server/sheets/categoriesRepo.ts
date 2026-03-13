import { DEFAULT_CATEGORIES } from "../../lib/defaults.js";
import type { Category } from "../../types/recipe.js";
import { ApiError } from "../http.js";
import { SheetRecord } from "./schema.js";
import { mutateTable, readTable, writeTable } from "./table.js";
import { createUniqueSlug, nowIso } from "./utils.js";

function mapCategory(row: SheetRecord<"categories">): Category {
  return {
    slug: row.slug,
    name: row.name,
    emoji: row.emoji,
    description: row.description,
  };
}

function buildCategoryRow(category: Category) {
  const now = nowIso();
  return {
    slug: category.slug,
    name: category.name,
    emoji: category.emoji,
    description: category.description,
    created_at: now,
    updated_at: now,
  } satisfies SheetRecord<"categories">;
}

async function ensureDefaultCategories() {
  const rows = await readTable("categories");
  if (rows.length > 0) return rows;

  await writeTable(
    "categories",
    DEFAULT_CATEGORIES.map((category) => buildCategoryRow(category)),
  );

  return readTable("categories");
}

export async function listCategories() {
  const rows = await ensureDefaultCategories();
  return rows.map(mapCategory).sort((left, right) => left.name.localeCompare(right.name));
}

export async function getCategoryBySlug(slug: string) {
  const categories = await listCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function createCategory(input: { name: string; emoji?: string; description?: string }) {
  const name = input.name.trim();
  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const now = nowIso();
  const createdRows = await mutateTable("categories", async (rows) => {
    const slugs = rows.map((row) => row.slug);
    const slug = createUniqueSlug(name, slugs);
    if (rows.some((row) => row.slug === slug)) {
      throw new ApiError(409, "Category slug already exists");
    }

    return [
      ...rows,
      {
        slug,
        name,
        emoji: input.emoji?.trim() || "📁",
        description: input.description?.trim() || "",
        created_at: now,
        updated_at: now,
      },
    ];
  });

  return mapCategory(createdRows[createdRows.length - 1]);
}
