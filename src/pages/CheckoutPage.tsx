import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app-context";
import { useCheckout } from "@/features/checkout/model/useCheckout";
import { CheckoutSummary } from "@/features/checkout/ui/CheckoutSummary";
import { useCart } from "@/hooks/use-cart";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const recipeSlug = searchParams.get("slug");
  const isCartCheckout = searchParams.get("cart") === "1";
  const { items: cartItems, clear: clearCart } = useCart();
  const { identityEmail, requireIdentity } = useAppContext();

  const {
    items,
    itemsLoading,
    payerName,
    payerNameError,
    total,
    status,
    currentEmail,
    setPayerName,
    handleCheckout,
  } = useCheckout({
    recipeSlug,
    isCartCheckout,
    cartItems,
    clearCart,
    identityEmail,
    requireIdentity,
    navigate,
  });

  if (itemsLoading) {
    return (
      <div className="container max-w-lg px-4 py-20 text-center">
        <PageHead title="Finalizar Compra" noindex />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
          <h1 className="text-xl font-bold sm:text-2xl tracking-tight">Carregando itens...</h1>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container max-w-lg px-4 py-20 text-center">
        <PageHead title="Finalizar Compra" noindex />
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-12 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h1 className="text-xl font-bold sm:text-2xl tracking-tight">Cesta Vazia</h1>
          <p className="mt-2 text-muted-foreground">Não encontramos receitas para finalizar.</p>
          <Button asChild variant="outline" className="mt-8 rounded-2xl px-8" size="lg">
            <Link to="/">Explorar Receitas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg animate-in fade-in slide-in-from-bottom-4 px-4 py-8 duration-700 sm:py-16">
      <PageHead title="Finalizar Compra" noindex />
      
      <div className="text-center space-y-2 mb-8">
        <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl italic text-orange-600">ReceitasBell</h1>
        <h2 className="text-xl font-bold sm:text-2xl">Finalizar Compra</h2>
        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
          {items.length === 1
            ? "Falta pouco para você ter acesso a esta receita incrível!"
            : `Você está levando ${items.length} receitas exclusivas.`}
        </p>
      </div>

      <CheckoutSummary
        items={items}
        payerName={payerName}
        payerNameError={payerNameError}
        total={total}
        status={status}
        buyerEmail={currentEmail}
        onPayerNameChange={setPayerName}
        onCheckout={() => void handleCheckout()}
      />

      <div className="mt-10 text-center">
        <Link
          to={items.length === 1 ? `/receitas/${items[0].slug}` : "/carrinho"}
          className="group flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          {items.length === 1 ? "Voltar para a receita" : "Revisar meu carrinho"}
        </Link>
      </div>
    </div>
  );
}
