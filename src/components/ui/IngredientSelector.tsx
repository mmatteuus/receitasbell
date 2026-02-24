import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface IngredientSelectorProps {
  ingredients: string[];
  recipeTitle: string;
}

export function IngredientSelector({ ingredients, recipeTitle }: IngredientSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (ingredient: string) => {
    const next = new Set(selected);
    if (next.has(ingredient)) {
      next.delete(ingredient);
    } else {
      next.add(ingredient);
    }
    setSelected(next);
  };

  const saveToShoppingList = () => {
    if (selected.size === 0) {
      toast.error("Selecione pelo menos um ingrediente");
      return;
    }

    try {
      const stored = localStorage.getItem("receitas_bell_shopping_list");
      const currentList = stored ? JSON.parse(stored) : [];
      
      const newItems = Array.from(selected).map(text => ({
        id: crypto.randomUUID(),
        text,
        recipe: recipeTitle,
        checked: false,
        createdAt: new Date().toISOString()
      }));

      localStorage.setItem("receitas_bell_shopping_list", JSON.stringify([...currentList, ...newItems]));
      toast.success(`${selected.size} itens adicionados à lista de compras!`);
      setSelected(new Set());
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar na lista de compras");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
          Ingredientes
        </h3>
        {ingredients.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={saveToShoppingList}
            className="gap-2 text-xs h-8 font-sans"
            disabled={selected.size === 0}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Adicionar ({selected.size})
          </Button>
        )}
      </div>
      
      <ul className="space-y-2 font-sans">
        {ingredients.map((ingredient, index) => {
          const isSelected = selected.has(ingredient);
          return (
            <li 
              key={index} 
              className={`flex items-start gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${isSelected ? "bg-muted" : ""}`}
              onClick={() => toggle(ingredient)}
            >
              <div className={`mt-1 h-4 w-4 shrink-0 rounded border border-primary flex items-center justify-center transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-transparent"}`}>
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <span className={`leading-relaxed ${isSelected ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {ingredient}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}