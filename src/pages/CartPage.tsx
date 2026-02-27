import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { getRecipeById, formatBRL } from "@/lib/storage";
import { PriceBadge } from "@/components/price-badge";

export default function CartPage() {
  const { items, remove, clear } = useCart();

  const recipes = items
    .map((id) => getRecipeById(id))
    .filter((r): r is NonNullable<typeof r> => !!r);

  const total = recipes.reduce((sum, r) => sum + (r.priceBRL || 0), 0);

  if (recipes.length === 0) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Carrinho vazio</h1>
        <p className="text-muted-foreground">Você ainda não adicionou receitas pagas ao carrinho.</p>
        <Button asChild>
          <Link to="/buscar?tier=paid">Ver receitas pagas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">Carrinho</h1>
      <p className="mt-1 text-sm text-muted-foreground">{recipes.length} {recipes.length === 1 ? "receita" : "receitas"}</p>

      <div className="mt-6 space-y-4">
        {recipes.map((r) => (
          <div key={r.id} className="flex gap-3 rounded-xl border bg-card p-3 shadow-sm sm:gap-4 sm:p-4">
            <Link to={`/receitas/${r.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
              <img src={r.image || "/placeholder.svg"} alt={r.title} className="h-full w-full object-cover" />
            </Link>
            <div className="flex flex-1 flex-col justify-between min-w-0">
              <div>
                <Link to={`/receitas/${r.slug}`} className="font-semibold text-sm sm:text-base line-clamp-1 hover:underline">
                  {r.title}
                </Link>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.description}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <PriceBadge accessTier={r.accessTier} priceBRL={r.priceBRL} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between text-lg font-bold">
        <span>Total</span>
        <span>{formatBRL(Math.round(total * 100) / 100)}</span>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1 bg-orange-600 hover:bg-orange-700">
          <Link to={`/checkout?cart=1`}>Finalizar Compra (simulado)</Link>
        </Button>
        <Button variant="outline" size="lg" className="gap-2" onClick={clear}>
          <Trash2 className="h-4 w-4" /> Limpar
        </Button>
      </div>
    </div>
  );
}
