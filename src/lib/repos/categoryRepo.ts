import { Category } from "@/types/recipe";
import { generateSlug } from "@/lib/helpers";

const KEY = "rdb_categories_v1";

const defaults: Category[] = [
  { name: "Salgadas", slug: "salgadas", emoji: "🧂", description: "Receitas salgadas para qualquer ocasião" },
  { name: "Massas", slug: "massas", emoji: "🍝", description: "Massas caseiras e molhos especiais" },
  { name: "Doces", slug: "doces", emoji: "🍬", description: "Sobremesas e doces irresistíveis" },
  { name: "Bolos", slug: "bolos", emoji: "🎂", description: "Bolos para todas as celebrações" },
  { name: "Bebidas", slug: "bebidas", emoji: "🥤", description: "Bebidas refrescantes e especiais" },
  { name: "Saudáveis", slug: "saudaveis", emoji: "🥗", description: "Receitas leves e nutritivas" },
];

export function getCategories(): Category[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(defaults));
    return [...defaults];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [...defaults];
  }
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getCategories().find((c) => c.slug === slug);
}

export function addCategory(cat: { name: string; emoji?: string; description?: string }): Category {
  const cats = getCategories();
  let slug = generateSlug(cat.name);
  // avoid collision
  let n = 2;
  const base = slug;
  while (cats.some((c) => c.slug === slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  const newCat: Category = {
    name: cat.name,
    slug,
    emoji: cat.emoji || "📁",
    description: cat.description || "",
  };
  cats.push(newCat);
  localStorage.setItem(KEY, JSON.stringify(cats));
  return newCat;
}

export function removeCategory(slug: string) {
  const cats = getCategories().filter((c) => c.slug !== slug);
  localStorage.setItem(KEY, JSON.stringify(cats));
}
