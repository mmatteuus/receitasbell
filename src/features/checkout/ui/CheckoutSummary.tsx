import type { ReactNode } from "react";
import { ArrowRight, CreditCard, Lock, QrCode, ShieldCheck, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatBRL } from "@/lib/helpers";
import type { CheckoutStatus } from "@/features/checkout/model/useCheckout";
import type { CartItem } from "@/types/cart";
import type { CheckoutPaymentMethod, PaymentIdentification } from "@/types/payment";

type CheckoutSummaryProps = {
  items: CartItem[];
  payerName: string;
  payerNameError: string;
  total: number;
  status: CheckoutStatus;
  paymentMode: "sandbox" | "production";
  paymentMethod: CheckoutPaymentMethod;
  buyerEmail: string | null;
  payerDocumentType: PaymentIdentification["type"];
  payerDocumentNumber: string;
  paymentConfigLoading: boolean;
  cardFormId: string;
  cardForm: ReactNode;
  onPayerNameChange: (value: string) => void;
  onPaymentMethodChange: (value: CheckoutPaymentMethod) => void | Promise<void>;
  onPayerDocumentTypeChange: (value: PaymentIdentification["type"]) => void;
  onPayerDocumentNumberChange: (value: string) => void;
  onCheckout: () => void;
};

function resolveLoadingLabel(status: CheckoutStatus, paymentMethod: CheckoutPaymentMethod) {
  if (status === "validating") {
    return "Validando dados...";
  }

  if (status === "submitting") {
    if (paymentMethod === "pix") {
      return "Gerando PIX...";
    }
    if (paymentMethod === "card") {
      return "Processando cartão...";
    }
    return "Criando pedido...";
  }

  return "Redirecionando...";
}

function resolveSubmitLabel(paymentMethod: CheckoutPaymentMethod, total: number) {
  if (paymentMethod === "pix") {
    return "Gerar PIX";
  }
  if (paymentMethod === "card") {
    return `Pagar ${formatBRL(total)}`;
  }
  return `Pagar ${formatBRL(total)}`;
}

function MethodButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className={[
        "flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition",
        active
          ? "border-orange-500 bg-orange-50 text-orange-950 shadow-sm"
          : "border-border bg-background hover:border-orange-200 hover:bg-orange-50/60",
      ].join(" ")}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm dark:bg-zinc-950 dark:text-orange-400">
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export function CheckoutSummary({
  items,
  payerName,
  payerNameError,
  total,
  status,
  paymentMode,
  paymentMethod,
  buyerEmail,
  payerDocumentType,
  payerDocumentNumber,
  paymentConfigLoading,
  cardFormId,
  cardForm,
  onPayerNameChange,
  onPaymentMethodChange,
  onPayerDocumentTypeChange,
  onPayerDocumentNumberChange,
  onCheckout,
}: CheckoutSummaryProps) {
  const isSubmitting =
    status === "validating" || status === "submitting" || status === "redirecting";

  return (
    <div className="mt-6 space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:mt-8 sm:p-6">
      {items.map((item) => (
        <div key={item.recipeId} className="flex gap-3 sm:gap-4">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20"
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-heading truncate text-sm font-semibold sm:text-lg">
              {item.title}
            </h2>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
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
        {buyerEmail ? (
          <p className="text-xs text-muted-foreground">
            E-mail da compra: <span className="font-medium text-foreground">{buyerEmail}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Como você quer pagar?</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <MethodButton
            icon={<Wallet className="h-4 w-4" />}
            label="Checkout MP"
            active={paymentMethod === "checkout_pro"}
            onClick={() => onPaymentMethodChange("checkout_pro")}
          />
          <MethodButton
            icon={<QrCode className="h-4 w-4" />}
            label="PIX"
            active={paymentMethod === "pix"}
            onClick={() => onPaymentMethodChange("pix")}
          />
          <MethodButton
            icon={<CreditCard className="h-4 w-4" />}
            label="Cartão"
            active={paymentMethod === "card"}
            onClick={() => onPaymentMethodChange("card")}
          />
        </div>
      </div>

      {paymentMethod === "pix" ? (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-sm font-medium text-emerald-950">Dados do pagador para o PIX</p>
          <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
            <label className="space-y-1 text-sm">
              <span className="text-emerald-900/70 font-medium">Tipo</span>
              <select
                value={payerDocumentType}
                onChange={(event) => onPayerDocumentTypeChange(event.target.value === "CNPJ" ? "CNPJ" : "CPF")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-emerald-900/70 font-medium">Número</span>
              <Input
                value={payerDocumentNumber}
                onChange={(event) => onPayerDocumentNumberChange(event.target.value)}
                placeholder={payerDocumentType === "CPF" ? "00000000000" : "00000000000000"}
                inputMode="numeric"
              />
            </label>
          </div>
          <p className="text-xs text-emerald-900/80">
            O Mercado Pago exige CPF ou CNPJ para gerar o QR Code do PIX.
          </p>
        </div>
      ) : null}

      {paymentMethod === "card" ? (
        <div className="space-y-2">
          {cardForm}
          {paymentConfigLoading ? (
            <p className="text-xs text-muted-foreground">Carregando os campos do cartão...</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-xl font-bold">{formatBRL(total)}</span>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
          Pagamento seguro via Mercado Pago
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 shrink-0 text-green-600" />
          Acesso vitalício ao conteúdo
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 shrink-0 text-green-600" />
          Liberação instantânea após confirmação
        </div>
      </div>

      <Button
        type={paymentMethod === "card" ? "submit" : "button"}
        form={paymentMethod === "card" ? cardFormId : undefined}
        onClick={paymentMethod === "card" ? undefined : onCheckout}
        disabled={isSubmitting}
        className="w-full gap-2 bg-orange-600 text-white hover:bg-orange-700"
        size="lg"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {resolveLoadingLabel(status, paymentMethod)}
          </span>
        ) : (
          <>
            {resolveSubmitLabel(paymentMethod, total)} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {paymentMethod === "checkout_pro" ? (
          paymentMode === "production"
            ? "Você será redirecionado para o checkout do Mercado Pago para concluir o pagamento."
            : "No modo sandbox, você será redirecionado para o checkout de testes do Mercado Pago."
        ) : paymentMethod === "pix" ? (
          "Vamos gerar um QR Code PIX e acompanhar a confirmação sem sair da página."
        ) : (
          "Os dados sensíveis do cartão são processados pelo Mercado Pago em campos seguros."
        )}
      </p>
    </div>
  );
}
