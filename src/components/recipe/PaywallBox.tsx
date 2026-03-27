import { Lock, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/helpers";
import { useCart } from "@/hooks/use-cart";
import { buildCartItemFromRecipe } from "@/lib/utils/recipeAccess";

interface PaywallBoxProps {
  priceBRL: number;
  recipeId: string;
  recipeSlug: string;
  recipeTitle?: string;
  imageUrl?: string | null;
}

export function PaywallBox({
  priceBRL,
  recipeId,
  recipeSlug,
  recipeTitle = "Receita premium",
  imageUrl = "/placeholder.svg",
}: PaywallBoxProps) {
  const { has, add } = useCart();
  const inCart = has(recipeId);

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/30 p-6 text-center dark:border-orange-900/30 dark:bg-orange-950/10 sm:p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-orange-100 p-4 text-orange-600 dark:bg-orange-900/50">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold sm:text-2xl">Conteúdo Exclusivo</h3>
        <p className="max-w-xs text-sm text-muted-foreground sm:text-base">
          Esta receita completa está disponível por apenas{" "}
          <span className="font-bold text-orange-600">{formatBRL(priceBRL)}</span>.
        </p>
        <div className="flex w-full max-w-xs flex-col gap-2 sm:max-w-sm sm:flex-row">
          <Button asChild size="lg" className="flex-1 bg-orange-600 hover:bg-orange-700">
            <Link to={`/checkout?slug=${recipeSlug}`}>Comprar Agora</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2"
            onClick={() =>
              add(
                buildCartItemFromRecipe({
                  id: recipeId,
                  title: recipeTitle,
                  slug: recipeSlug,
                  priceBRL,
                  imageUrl,
                }),
              )
            }
            disabled={inCart}
          >
            <ShoppingCart className="h-4 w-4" />
            {inCart ? "No carrinho" : "Adicionar ao carrinho"}
          </Button>
        </div>
      </div>
    </div>
  );
}
