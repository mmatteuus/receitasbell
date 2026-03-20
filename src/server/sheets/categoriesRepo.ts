import { DEFAULT_CATEGORIES } from "../../lib/defaults.js";
import type { Category } from "../../types/category.js";
import { ApiError } from "../http.js";
import { SheetRecord } from "./schema.js";
import { mutateTable, readTable, writeTable } from "./table.js";
import { createUniqueSlug, nowIso } from "./utils.js";

function mapCategory(row: SheetRecord<"categories">): Category {
  return {
    id: row.id || `cat-${row.slug}`,
    slug: row.slug,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

function buildCategoryRow(category: Category) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    emoji: "",
    description: category.description,
    created_at: category.createdAt,
    updated_at: category.createdAt,
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

export async function getCategoryById(id: string) {
  const categories = await listCategories();
  return categories.find((category) => category.id === id) ?? null;
}

export async function getCategoryBySlug(slug: string) {
  const categories = await listCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function createCategory(input: { name: string; description?: string }) {
  const name = input.name.trim();
  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const now = nowIso();
  const createdRows = await mutateTable("categories", async (rows) => {
    const slugs = rows.map((row) => row.slug);
    const slug = createUniqueSlug(name, slugs);

    return [
      ...rows,
      {
        id: crypto.randomUUID(),
        slug,
        name,
        emoji: "",
        description: input.description?.trim() || "",
        created_at: now,
        updated_at: now,
      },
    ];
  });

  return mapCategory(createdRows[createdRows.length - 1]);
}

export async function updateCategory(
  categoryId: string,
  input: { name: string; description?: string },
) {
  const name = input.name.trim();
  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const now = nowIso();
  const updatedRows = await mutateTable("categories", async (rows) => {
    const current = rows.find((row) => row.id === categoryId);
    if (!current) {
      throw new ApiError(404, "Category not found");
    }

    const slug = createUniqueSlug(
      name,
      rows.filter((row) => row.id !== categoryId).map((row) => row.slug),
      current.slug,
    );

    return rows.map((row) =>
      row.id !== categoryId
        ? row
        : {
            ...row,
            slug,
            name,
            emoji: row.emoji || "",
            description: input.description?.trim() || "",
            updated_at: now,
          },
    );
  });

  return mapCategory(updatedRows.find((row) => row.id === categoryId)!);
}

export async function deleteCategory(categoryId: string) {
  const [categories, recipes] = await Promise.all([readTable("categories"), readTable("recipes")]);
  const category = categories.find((row) => row.id === categoryId);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const linkedRecipes = recipes.filter((recipe) => recipe.category_slug === category.slug);
  if (linkedRecipes.length > 0) {
    throw new ApiError(409, "Category cannot be deleted while recipes are linked to it");
  }

  await writeTable(
    "categories",
    categories.filter((row) => row.id !== categoryId),
  );
}

export async function hasRecipes(categorySlug: string) {
  const recipes = await readTable("recipes");
  return recipes.some((recipe) => recipe.category_slug === categorySlug);
}
