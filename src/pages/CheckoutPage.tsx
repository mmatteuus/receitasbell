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
  const { identityEmail, requireIdentity, settings } = useAppContext();

  const {
    items,
    itemsLoading,
    payerName,
    payerNameError,
    total,
    status,
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
        <h1 className="text-xl font-bold sm:text-2xl">Carregando itens do checkout...</h1>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container max-w-lg px-4 py-20 text-center">
        <PageHead title="Finalizar Compra" noindex />
        <h1 className="text-xl font-bold sm:text-2xl">Nenhuma receita selecionada</h1>
        <p className="text-muted-foreground mt-2">Não foi possível carregar os dados.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg px-4 py-8 sm:py-12 animate-in fade-in duration-500">
      <PageHead title="Finalizar Compra" noindex />
      <h1 className="font-heading text-2xl font-bold text-center sm:text-3xl">Finalizar Compra</h1>
      <p className="text-center text-muted-foreground mt-2 text-sm">
        {items.length === 1
          ? "Você está prestes a desbloquear uma receita exclusiva"
          : `${items.length} receitas no pedido`}
      </p>

      <CheckoutSummary
        items={items}
        payerName={payerName}
        payerNameError={payerNameError}
        total={total}
        status={status}
        paymentMode={settings.payment_mode}
        onPayerNameChange={setPayerName}
        onCheckout={() => void handleCheckout()}
      />

      <div className="mt-6 text-center">
        <Link
          to={items.length === 1 ? `/receitas/${items[0].slug}` : "/carrinho"}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Voltar
        </Link>
      </div>
    </div>
  );
}
