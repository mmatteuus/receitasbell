import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getRecipeBySlug, getRecipeById } from "@/lib/storage";
import { useDemoPurchase } from "@/hooks/use-demo-purchase";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Lock, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { toast } from "sonner";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const recipeId = searchParams.get("recipeId");
  const recipeSlug = searchParams.get("slug");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const { unlockRecipe } = useDemoPurchase();

  useEffect(() => {
    if (recipeId) {
      const r = getRecipeById(recipeId);
      if (r) setRecipe(r);
    } else if (recipeSlug) {
      const r = getRecipeBySlug(recipeSlug);
      if (r) setRecipe(r);
    }
  }, [recipeId, recipeSlug]);

  const formattedPrice = recipe?.priceCents
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(recipe.priceCents / 100)
    : "R$ 0,00";

  const handleCheckout = async () => {
    if (!recipe) return;
    setLoading(true);

    // Simula chamada a POST /api/mp/create-preference
    // Em produção, isso faria fetch para o backend e redirecionaria para init_point do Mercado Pago
    await new Promise((r) => setTimeout(r, 1500));

    // Mock: simula pagamento aprovado instantaneamente
    unlockRecipe(recipe.id);
    toast.success("Pagamento aprovado! (simulação)");

    // Redireciona para página de sucesso
    window.location.href = `/compra/sucesso?slug=${recipe.slug}&status=approved&payment_id=mock-${Date.now()}`;
  };

  if (!recipe) {
    return (
      <div className="container max-w-lg py-20 text-center">
        <h1 className="text-2xl font-bold">Receita não encontrada</h1>
        <p className="text-muted-foreground mt-2">Não foi possível carregar os dados desta receita.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-12 animate-in fade-in duration-500">
      <h1 className="font-heading text-3xl font-bold text-center">Finalizar Compra</h1>
      <p className="text-center text-muted-foreground mt-2">Você está prestes a desbloquear uma receita exclusiva</p>

      <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex gap-4">
          {recipe.image && (
            <img src={recipe.image} alt={recipe.title} className="h-20 w-20 rounded-lg object-cover" />
          )}
          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold">{recipe.title}</h2>
            <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Receita completa</span>
          <span className="text-xl font-bold">{formattedPrice}</span>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600" /> Pagamento seguro via Mercado Pago</div>
          <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-green-600" /> Acesso vitalício ao conteúdo completo</div>
          <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-green-600" /> Liberação instantânea após aprovação</div>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processando...
            </span>
          ) : (
            <>
              Pagar {formattedPrice}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Em produção, você seria redirecionado para o Checkout do Mercado Pago.
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link to={`/receitas/${recipe.slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
          ← Voltar para a receita
        </Link>
      </div>
    </div>
  );
}
