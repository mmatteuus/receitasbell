import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ShoppingCart, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShoppingItem {
  id: string;
  text: string;
  recipe: string;
  checked: boolean;
  createdAt: string;
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("receitas_bell_shopping_list");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      } catch (e) {
        console.error("Failed to parse shopping list", e);
      }
    }
  }, []);

  const saveItems = (newItems: ShoppingItem[]) => {
    setItems(newItems);
    localStorage.setItem("receitas_bell_shopping_list", JSON.stringify(newItems));
  };

  const toggleItem = (id: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    saveItems(newItems);
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    saveItems(newItems);
    toast.success("Item removido");
  };

  const clearList = () => {
    if (confirm("Tem certeza que deseja limpar toda a lista?")) {
      saveItems([]);
      toast.success("Lista limpa");
    }
  };

  // Group by recipe
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.recipe]) acc[item.recipe] = [];
    acc[item.recipe].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center flex flex-col items-center font-sans">
        <div className="bg-muted p-6 rounded-full mb-6">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-3xl font-bold mb-2">Sua lista está vazia</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Adicione ingredientes das receitas que você gosta para organizar suas compras.
        </p>
        <Link to="/buscar">
          <Button className="gap-2">
            Explorar Receitas <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10 font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
          <ShoppingCart className="h-8 w-8" />
          Lista de Compras
        </h1>
        <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearList}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpar
        </Button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedItems).map(([recipe, recipeItems]) => (
          <div key={recipe} className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-6 py-3 border-b">
              <h3 className="font-serif font-semibold text-lg">{recipe}</h3>
            </div>
            <div className="divide-y">
              {recipeItems.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/20 ${item.checked ? "bg-muted/10" : ""}`}>
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleItem(item.id)}>
                    <div className={`shrink-0 ${item.checked ? "text-primary" : "text-muted-foreground"}`}>
                      {item.checked ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </div>
                    <span className={`${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}