import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app-context";
import { useCheckout } from "@/features/checkout/model/useCheckout";
import { CheckoutCardForm } from "@/features/checkout/ui/CheckoutCardForm";
import { CheckoutPixDialog } from "@/features/checkout/ui/CheckoutPixDialog";
import { CheckoutSummary } from "@/features/checkout/ui/CheckoutSummary";
import { useCart } from "@/hooks/use-cart";

const cardFormId = "checkout-card-form";

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
    isSubmitting,
    paymentMethod,
    paymentConfig,
    paymentConfigLoading,
    currentEmail,
    payerDocumentType,
    payerDocumentNumber,
    pixPayment,
    pixDialogOpen,
    pixChecking,
    setPayerName,
    setPayerDocumentType,
    setPayerDocumentNumber,
    setPixDialogOpen,
    handlePaymentMethodChange,
    handleCheckout,
    handleCardPayment,
    copyPixCode,
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
        <p className="mt-2 text-muted-foreground">Não foi possível carregar os dados.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-lg animate-in fade-in px-4 py-8 duration-500 sm:py-12">
        <PageHead title="Finalizar Compra" noindex />
        <h1 className="text-center font-heading text-2xl font-bold sm:text-3xl">Finalizar Compra</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
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
          paymentMethod={paymentMethod}
          buyerEmail={currentEmail}
          payerDocumentType={payerDocumentType}
          payerDocumentNumber={payerDocumentNumber}
          paymentConfigLoading={paymentConfigLoading}
          cardFormId={cardFormId}
          cardForm={
            paymentMethod === "card" && paymentConfig?.publicKey && currentEmail ? (
              <CheckoutCardForm
                formId={cardFormId}
                publicKey={paymentConfig.publicKey}
                amountBRL={total}
                payerName={payerName}
                buyerEmail={currentEmail}
                onSubmit={handleCardPayment}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                {paymentMethod === "card"
                  ? "Confirme o e-mail da compra e aguarde a inicialização do cartão."
                  : null}
              </div>
            )
          }
          onPayerNameChange={setPayerName}
          onPaymentMethodChange={handlePaymentMethodChange}
          onPayerDocumentTypeChange={setPayerDocumentType}
          onPayerDocumentNumberChange={setPayerDocumentNumber}
          onCheckout={() => void handleCheckout()}
        />

        <div className="mt-6 text-center">
          <Link
            to={items.length === 1 ? `/receitas/${items[0].slug}` : "/carrinho"}
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            ← Voltar
          </Link>
        </div>
      </div>

      <CheckoutPixDialog
        open={pixDialogOpen}
        payment={pixPayment}
        checking={pixChecking || isSubmitting}
        onCopyCode={copyPixCode}
        onOpenChange={setPixDialogOpen}
      />
    </>
  );
}
