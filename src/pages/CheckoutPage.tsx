import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { getRecipeBySlug, getRecipeById, formatBRL } from "@/lib/storage";
import { useDemoPurchase } from "@/hooks/use-demo-purchase";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Lock, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const recipeSlug = searchParams.get("slug");
  const isCartCheckout = searchParams.get("cart") === "1";
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const { unlockRecipe } = useDemoPurchase();
  const { items: cartItems, clear: clearCart } = useCart();

  useEffect(() => {
    if (isCartCheckout) {
      const cartRecipes = cartItems
        .map((id) => getRecipeById(id))
        .filter((r): r is Recipe => !!r && r.accessTier === "paid");
      setRecipes(cartRecipes);
    } else if (recipeSlug) {
      const r = getRecipeBySlug(recipeSlug);
      if (r) setRecipes([r]);
    }
  }, [recipeSlug, isCartCheckout, cartItems]);

  const total = recipes.reduce((sum, r) => sum + (r.priceBRL || 0), 0);

  const handleCheckout = async () => {
    if (!recipes.length) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    recipes.forEach((r) => unlockRecipe(r.id));
    if (isCartCheckout) clearCart();
    toast.success("Pagamento aprovado! (simulação)");
    const slug = recipes.length === 1 ? recipes[0].slug : "";
    navigate(`/compra/sucesso?slug=${slug}&status=approved&payment_id=mock-${Date.now()}&count=${recipes.length}`);
  };

  if (!recipes.length) {
    return (
      <div className="container max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold sm:text-2xl">Nenhuma receita selecionada</h1>
        <p className="text-muted-foreground mt-2">Não foi possível carregar os dados.</p>
        <Button asChild variant="outline" className="mt-6"><Link to="/">Voltar</Link></Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg px-4 py-8 sm:py-12 animate-in fade-in duration-500">
      <h1 className="font-heading text-2xl font-bold text-center sm:text-3xl">Finalizar Compra</h1>
      <p className="text-center text-muted-foreground mt-2 text-sm">
        {recipes.length === 1 ? "Você está prestes a desbloquear uma receita exclusiva" : `${recipes.length} receitas no pedido`}
      </p>

      <div className="mt-6 sm:mt-8 rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="flex gap-3 sm:gap-4">
            {recipe.image && (
              <img src={recipe.image} alt={recipe.title} className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-sm font-semibold sm:text-lg truncate">{recipe.title}</h2>
              <p className="text-xs text-muted-foreground line-clamp-1 sm:text-sm">{recipe.description}</p>
              <p className="text-sm font-bold mt-1">{formatBRL(recipe.priceBRL || 0)}</p>
            </div>
          </div>
        ))}

        <Separator />

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold">{formatBRL(Math.round(total * 100) / 100)}</span>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600 shrink-0" /> Pagamento seguro via Mercado Pago</div>
          <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-green-600 shrink-0" /> Acesso vitalício ao conteúdo</div>
          <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-green-600 shrink-0" /> Liberação instantânea</div>
        </div>

        <Button onClick={handleCheckout} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2" size="lg">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processando...
            </span>
          ) : (
            <>Pagar {formatBRL(Math.round(total * 100) / 100)} <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Em produção, você seria redirecionado para o Checkout do Mercado Pago.
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link to={recipes.length === 1 ? `/receitas/${recipes[0].slug}` : "/carrinho"} className="text-sm text-muted-foreground hover:text-primary transition-colors">
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
