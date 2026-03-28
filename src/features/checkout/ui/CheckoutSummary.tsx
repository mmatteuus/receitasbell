import { ArrowRight, Lock, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatBRL } from "@/lib/helpers";
import type { CheckoutStatus } from "@/features/checkout/model/useCheckout";
import type { CartItem } from "@/types/cart";

type CheckoutSummaryProps = {
  items: CartItem[];
  payerName: string;
  payerNameError: string;
  total: number;
  status: CheckoutStatus;
  paymentMode: "sandbox" | "production";
  onPayerNameChange: (value: string) => void;
  onCheckout: () => void;
};

function resolveLoadingLabel(status: CheckoutStatus) {
  if (status === "validating") {
    return "Validando dados...";
  }

  if (status === "submitting") {
    return "Criando pedido...";
  }

  return "Redirecionando...";
}

export function CheckoutSummary({
  items,
  payerName,
  payerNameError,
  total,
  status,
  paymentMode,
  onPayerNameChange,
  onCheckout,
}: CheckoutSummaryProps) {
  const isSubmitting =
    status === "validating" || status === "submitting" || status === "redirecting";

  return (
    <div className="mt-6 sm:mt-8 rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
      {items.map((item) => (
        <div key={item.recipeId} className="flex gap-3 sm:gap-4">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-16 w-16 rounded-lg object-cover shrink-0 sm:h-20 sm:w-20"
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-sm font-semibold sm:text-lg truncate">
              {item.title}
            </h2>
            <p className="text-xs text-muted-foreground line-clamp-1 sm:text-sm">
              Receita premium desbloqueada após a compra
            </p>
            <p className="mt-1 text-sm font-bold">{formatBRL(item.priceBRL)}</p>
          </div>
        </div>
      ))}

      <Separator />

      <div className="space-y-2">
        <label htmlFor="payer-name" className="text-sm font-medium">Nome do pagador</label>
        <Input
          id="payer-name"
          value={payerName}
          onChange={(event) => onPayerNameChange(event.target.value)}
          aria-invalid={Boolean(payerNameError)}
          aria-describedby={payerNameError ? "payer-name-error" : undefined}
          placeholder="Ex: Bell Ferreira"
        />
        {payerNameError ? (
          <p id="payer-name-error" role="alert" className="text-sm text-destructive">
            {payerNameError}
          </p>
        ) : null}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-xl font-bold">{formatBRL(total)}</span>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
          Pagamento seguro via Mercado Pago
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-green-600 shrink-0" />
          Acesso vitalício ao conteúdo
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-green-600 shrink-0" />
          Liberação instantânea
        </div>
      </div>

      <Button
        onClick={onCheckout}
        disabled={isSubmitting}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
        size="lg"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {resolveLoadingLabel(status)}
          </span>
        ) : (
          <>
            Pagar {formatBRL(total)} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {paymentMode === "production"
          ? "Você será redirecionado para o Checkout do Mercado Pago para concluir o pagamento."
          : "No modo sandbox, você será redirecionado para o checkout de testes do Mercado Pago."}
      </p>
    </div>
  );
}
