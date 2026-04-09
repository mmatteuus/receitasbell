import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ListChecks, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  listShoppingItemsOfflineAware,
  createShoppingItemsOfflineAware,
  updateShoppingItemOfflineAware,
  deleteShoppingItemOfflineAware,
} from "@/pwa/offline/repos/shopping-offline-repo";
import type { ShoppingListItem } from "@/lib/api/interactions";
import { PWA_OFFLINE_DATA_CHANGED_EVENT } from "@/pwa/offline/events";
import { useOfflineStatus } from "@/pwa/offline/hooks/useOfflineStatus";
import { Skeleton } from "@/components/ui/skeleton";

export default function PwaShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [manualItem, setManualItem] = useState("");
  const [loading, setLoading] = useState(true);
  const { offline } = useOfflineStatus();

  async function loadItems() {
    try {
      const result = await listShoppingItemsOfflineAware();
      setItems(result);
    } catch {
      toast.error("Não foi possível carregar a lista.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
    const handleChange = () => void loadItems();
    window.addEventListener(PWA_OFFLINE_DATA_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(PWA_OFFLINE_DATA_CHANGED_EVENT, handleChange);
  }, []);

  const toggleItem = async (item: ShoppingListItem) => {
    // Otimista: atualiza UI imediatamente
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, checked: !entry.checked } : entry,
      ),
    );
    try {
      await updateShoppingItemOfflineAware(item.id, { checked: !item.checked });
    } catch {
      // Reverte em erro
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, checked: item.checked } : entry,
        ),
      );
      toast.error("Não foi possível atualizar o item.");
    }
  };

  const removeItem = async (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      await deleteShoppingItemOfflineAware(id);
    } catch {
      toast.error("Não foi possível remover o item.");
      void loadItems();
    }
  };

  const clearList = async () => {
    if (!confirm("Tem certeza que deseja limpar toda a lista?")) return;
    const currentItems = [...items];
    setItems([]);
    try {
      await Promise.all(currentItems.map((item) => deleteShoppingItemOfflineAware(item.id)));
      toast.success("Lista limpa");
    } catch {
      toast.error("Não foi possível limpar a lista.");
      void loadItems();
    }
  };

  const handleManualAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualItem.trim()) return;
    const text = manualItem.trim();
    setManualItem("");
    try {
      await createShoppingItemsOfflineAware([{ text, recipeTitleSnapshot: "Itens avulsos" }]);
      // loadItems é disparado pelo evento PWA_OFFLINE_DATA_CHANGED_EVENT
    } catch {
      toast.error("Não foi possível adicionar o item.");
      setManualItem(text);
    }
  };

  const groupedItems = items.reduce(
    (acc, item) => {
      const group = item.recipeTitleSnapshot || "Itens avulsos";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, ShoppingListItem[]>,
  );

  return (
    <>
      <PageHead title="Lista de Compras" noindex />
      <div className="space-y-6 pb-8 animate-in fade-in duration-500">
        {/* Header */}
        <section className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <ListChecks className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Minha Lista</h1>
          </div>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => void clearList()}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Limpar
            </Button>
          )}
        </section>

        {/* Adicionar item manualmente */}
        <form onSubmit={(e) => void handleManualAdd(e)} className="flex gap-2">
          <Input
            placeholder="Adicionar item manualmente..."
            value={manualItem}
            onChange={(e) => setManualItem(e.target.value)}
          />
          <Button type="submit" size="sm">
            Adicionar
          </Button>
        </form>

        {offline && (
          <p className="text-xs text-muted-foreground px-1" role="status">
            Alterações salvas neste dispositivo — serão sincronizadas quando a conexão voltar.
          </p>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center py-16 border-2 border-dashed rounded-2xl">
            <div className="p-4 bg-muted rounded-full">
              <ListChecks className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Sua lista está vazia</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Adicione ingredientes de receitas ou itens manuais acima.
            </p>
            <Link to="/pwa/app/buscar">
              <Button size="sm" className="gap-2">
                Explorar receitas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([group, groupItems]) => (
              <div key={group} className="rounded-2xl border bg-card/50 overflow-hidden">
                <div className="bg-muted/30 px-4 py-2.5 border-b">
                  <h3 className="text-sm font-semibold">{group}</h3>
                </div>
                <div className="divide-y">
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${item.checked ? "bg-muted/10" : ""}`}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-3 flex-1 text-left"
                        onClick={() => void toggleItem(item)}
                      >
                        <div className={`shrink-0 ${item.checked ? "text-primary" : "text-muted-foreground"}`}>
                          {item.checked ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>
                        <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : "font-medium"}`}>
                          {item.text}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => void removeItem(item.id)}
                        aria-label="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
