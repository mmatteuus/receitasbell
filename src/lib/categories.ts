import { Category } from "@/types/recipe";

export const categories: Category[] = [
  { name: "Salgadas", slug: "salgadas", emoji: "🧂", description: "Receitas salgadas para qualquer ocasião" },
  { name: "Massas", slug: "massas", emoji: "🍝", description: "Massas caseiras e molhos especiais" },
  { name: "Doces", slug: "doces", emoji: "🍬", description: "Sobremesas e doces irresistíveis" },
  { name: "Bolos", slug: "bolos", emoji: "🎂", description: "Bolos para todas as celebrações" },
  { name: "Bebidas", slug: "bebidas", emoji: "🥤", description: "Bebidas refrescantes e especiais" },
  { name: "Saudáveis", slug: "saudaveis", emoji: "🥗", description: "Receitas leves e nutritivas" },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
