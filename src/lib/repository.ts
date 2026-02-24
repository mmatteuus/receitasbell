import { Recipe } from "../model/types";
import { seedRecipes } from "../lib/seed";

const STORAGE_KEY = "receitas_bell_recipes";

export const recipeRepository = {
  async getAll(): Promise<Recipe[]> {
    // Simulate async
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRecipes));
      return seedRecipes;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse recipes", e);
      return seedRecipes;
    }
  },

  async getBySlug(slug: string): Promise<Recipe | null> {
    const recipes = await this.getAll();
    return recipes.find(r => r.slug === slug) || null;
  }
};