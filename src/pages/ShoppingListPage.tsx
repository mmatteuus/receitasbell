import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Trash2, ShoppingCart, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  createShoppingListItems,
  deleteShoppingListItem,
  listShoppingList,
  type ShoppingListItem,
  updateShoppingListItem,
} from "@/lib/api/interactions";
import { useAppContext } from "@/contexts/app-context";

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [manualItem, setManualItem] = useState("");
  const [loading, setLoading] = useState(true);
  const { requireIdentity, identityEmail } = useAppContext();

  useEffect(() => {
    let isMounted = true;
    async function loadItems() {
      if (!identityEmail) return;

      setLoading(true);
      try {
        const result = await listShoppingList();
        if (isMounted) setItems(result);
      } catch (error) {
        console.error("Failed to load shopping list", error);
        toast.error("Não foi possível carregar a lista de compras.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadItems();
    return () => { isMounted = false; };
  }, [identityEmail]);

  if (!identityEmail) {
    return <Navigate to="/minha-conta?redirect=/minha-conta/lista-de-compras" replace />;
  }

  const toggleItem = async (item: ShoppingListItem) => {
    try {
      const updated = await updateShoppingListItem(item.id, { checked: !item.checked });
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch (error) {
      console.error("Failed to update shopping list item", error);
      toast.error("Nao foi possivel atualizar o item.");
    }
  };

  const removeItem = async (id: string) => {
    try {
      await deleteShoppingListItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
      toast.success("Item removido");
    } catch (error) {
      console.error("Failed to delete shopping list item", error);
      toast.error("Nao foi possivel remover o item.");
    }
  };

  const clearList = async () => {
    if (confirm("Tem certeza que deseja limpar toda a lista?")) {
      try {
        await Promise.all(items.map((item) => deleteShoppingListItem(item.id)));
        setItems([]);
        toast.success("Lista limpa");
      } catch (error) {
        console.error("Failed to clear shopping list", error);
        toast.error("Nao foi possivel limpar a lista.");
      }
    }
  };

  const handleManualAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualItem.trim()) return;

    try {
      const next = await createShoppingListItems([
        {
          text: manualItem.trim(),
          recipeTitleSnapshot: "Itens avulsos",
        },
      ]);
      setItems(next);
      setManualItem("");
      toast.success("Item adicionado");
    } catch (error) {
      console.error("Failed to add shopping list item", error);
      toast.error("Nao foi possivel adicionar o item.");
    }
  };

  // Group by recipe
  const groupedItems = items.reduce((acc, item) => {
    const group = item.recipeTitleSnapshot || "Itens avulsos";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  if (loading) {
    return (
      <>
        <PageHead
          title="Lista de Compras"
          description="Sua lista de compras personalizada com ingredientes das receitas"
          noindex={true}
        />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Carregando lista de compras...</p>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <PageHead
          title="Lista de Compras"
          description="Sua lista de compras personalizada com ingredientes das receitas"
          noindex={true}
        />
        <div className="container py-20 text-center flex flex-col items-center font-sans">
        <div className="bg-muted p-6 rounded-full mb-6">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-3xl font-bold mb-2">Sua lista está vazia</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Adicione ingredientes das receitas que você gosta para organizar suas compras.
        </p>
        <form onSubmit={handleManualAdd} className="mb-6 flex w-full max-w-md gap-2">
          <Input
            placeholder={identityEmail ? "Ex: 2 tomates" : "Informe seu e-mail para continuar"}
            value={manualItem}
            onChange={(event) => setManualItem(event.target.value)}
          />
          <Button type="submit">Adicionar</Button>
        </form>
        <Link to="/buscar">
          <Button className="gap-2">
            Explorar Receitas <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Lista de Compras"
        description="Sua lista de compras personalizada com ingredientes das receitas"
        noindex={true}
      />
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

      <form onSubmit={handleManualAdd} className="mb-6 flex gap-2">
        <Input
          placeholder="Adicionar item manualmente"
          value={manualItem}
          onChange={(event) => setManualItem(event.target.value)}
        />
        <Button type="submit">Adicionar</Button>
      </form>

      <div className="space-y-8">
        {Object.entries(groupedItems).map(([recipe, recipeItems]) => (
          <div key={recipe} className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-6 py-3 border-b">
              <h3 className="font-serif font-semibold text-lg">{recipe}</h3>
            </div>
            <div className="divide-y">
              {recipeItems.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/20 ${item.checked ? "bg-muted/10" : ""}`}>
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => void toggleItem(item)}>
                    <div className={`shrink-0 ${item.checked ? "text-primary" : "text-muted-foreground"}`}>
                      {item.checked ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </div>
                    <span className={`${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => void removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
