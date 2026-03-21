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
  customServings: number;
  showPaywall: boolean;
}

function formatQuantity(num: number): string {
  if (num % 1 === 0) return String(num);
  const whole = Math.floor(num);
  const fraction = num - whole;
  
  let fStr = "";
  if (Math.abs(fraction - 0.25) < 0.01) fStr = "1/4";
  else if (Math.abs(fraction - 0.33) < 0.02) fStr = "1/3";
  else if (Math.abs(fraction - 0.5) < 0.01) fStr = "1/2";
  else if (Math.abs(fraction - 0.66) < 0.02) fStr = "2/3";
  else if (Math.abs(fraction - 0.75) < 0.01) fStr = "3/4";
  
  if (fStr) {
    return whole > 0 ? `${whole} e ${fStr}` : fStr;
  }
  
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(num);
}

function scaleIngredient(text: string, baseServings: number, customServings: number) {
  const factor = customServings / baseServings;
  if (factor === 1) return text;
  
  const regex = /^(?:(\d+)\s+(?:e\s+)?(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)|(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?))/i;
  const match = text.match(regex);
  if (!match) return text;
  
  const numberPart = match[0];
  const rest = text.substring(numberPart.length);
  
  let value = 0;
  // Handle "1 e 1/2" or "1 1/2" or "1.5"
  const parts = numberPart.toLowerCase().split(/\s+e\s+|\s+/).filter(Boolean);
  
  parts.forEach((part) => {
    if (part.includes("/")) {
      const [num, den] = part.split("/");
      value += parseFloat(num) / parseFloat(den);
    } else {
      value += parseFloat(part.replace(",", "."));
    }
  });

  if (Number.isNaN(value) || value <= 0) return text;
  
  return `${formatQuantity(value * factor)}${rest}`;
}

export default function RecipeIngredients({
  recipeId,
  recipeTitle,
  ingredients,
  servings,
  customServings,
  showPaywall,
}: RecipeIngredientsProps) {
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
