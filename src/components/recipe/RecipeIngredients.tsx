import { useState } from "react";
import { ListPlus, Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createShoppingListItems } from "@/lib/api/interactions";
import { ApiClientError } from "@/lib/api/client";
import { useAppContext } from "@/contexts/app-context";
import { toast } from "sonner";

interface RecipeIngredientsProps {
  recipeId: string;
  recipeTitle: string;
  ingredients: string[];
  servings: number;
  showPaywall: boolean;
}

function scaleIngredient(text: string, baseServings: number, customServings: number) {
  const factor = customServings / baseServings;
  if (factor === 1) return text;
  const regex = /^(?:(\d+)\s+e\s+)?(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)/i;
  const match = text.match(regex);
  if (!match) return text;
  const numberStr = match[0];
  const rest = text.substring(numberStr.length);
  let value = 0;
  numberStr.toLowerCase().split(" e ").forEach((part) => {
    if (part.includes("/")) {
      const [numerator, denominator] = part.split("/");
      value += parseFloat(numerator) / parseFloat(denominator);
    } else {
      value += parseFloat(part.replace(",", "."));
    }
  });
  if (Number.isNaN(value)) return text;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value * factor)}${rest}`;
}

export default function RecipeIngredients({
  recipeId,
  recipeTitle,
  ingredients,
  servings,
  showPaywall,
}: RecipeIngredientsProps) {
  const [customServings, setCustomServings] = useState(servings);
  const [shoppingListLoading, setShoppingListLoading] = useState(false);
  const { requireIdentity } = useAppContext();

  async function handleAddToShoppingList() {
    const email = await requireIdentity("Digite seu e-mail para salvar sua lista de compras.");
    if (!email) return;

    setShoppingListLoading(true);
    try {
      await createShoppingListItems(
        ingredients.map((text) => ({
          recipeId,
          recipeTitleSnapshot: recipeTitle,
          text,
        })),
      );
      toast.success("Ingredientes enviados para a lista de compras");
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.message);
        return;
      }
      console.error("Failed to add ingredients to shopping list", error);
      toast.error("Não foi possível atualizar a lista de compras.");
    } finally {
      setShoppingListLoading(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
        <Users className="h-4 w-4 text-primary" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-5 w-5 print:hidden" onClick={() => setCustomServings((v) => Math.max(1, v - 1))}>
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium">{customServings} porções</span>
          <Button variant="ghost" size="icon" className="h-5 w-5 print:hidden" onClick={() => setCustomServings((v) => v + 1)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Separator className="my-6 sm:my-8 print:my-4" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold sm:text-2xl print:text-xl">
          Ingredientes
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            (para {customServings} {customServings === 1 ? "pessoa" : "pessoas"})
          </span>
        </h2>
        <Button variant="outline" size="sm" className="gap-2 print:hidden" onClick={() => void handleAddToShoppingList()} disabled={shoppingListLoading}>
          <ListPlus className="h-4 w-4" />
          {shoppingListLoading ? "Salvando..." : "Enviar para lista de compras"}
        </Button>
      </div>

      <ul className="mt-3 space-y-2 sm:mt-4 print:space-y-1">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="flex items-start gap-2 text-sm print:text-base">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary print:bg-black" />
            {scaleIngredient(ingredient, servings, customServings)}
          </li>
        ))}
        {showPaywall && (
          <li className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 p-3 text-sm italic text-muted-foreground">
            ... e mais ingredientes (disponível após a compra)
          </li>
        )}
      </ul>
    </>
  );
}

export { scaleIngredient };
