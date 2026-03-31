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
  buyerEmail: string | null;
  onPayerNameChange: (value: string) => void;
  onCheckout: () => void;
};

export function CheckoutSummary({
  items,
  payerName,
  payerNameError,
  total,
  status,
  buyerEmail,
  onPayerNameChange,
  onCheckout,
}: CheckoutSummaryProps) {
  const isSubmitting =
    status === "validating" || status === "submitting" || status === "redirecting";

  return (
    <div className="mt-6 space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:mt-8 sm:p-8">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.recipeId} className="flex gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border sm:h-20 sm:w-20">
              <img
                src={item.imageUrl ?? ""}
                alt={item.title}
                className="h-full w-full object-cover transition-transform hover:scale-110"
              />
            </div>
            <div className="min-w-0 flex-1 py-1">
              <h2 className="font-heading truncate text-base font-bold sm:text-lg">
                {item.title}
              </h2>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
                Desbloqueio imediato da receita premium
              </p>
              <p className="mt-2 text-base font-black text-orange-600 sm:text-lg">
                {formatBRL(item.priceBRL)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="payer-name" className="text-sm font-semibold tracking-tight">
            Nome Completo
          </label>
          <Input
            id="payer-name"
            value={payerName}
            onChange={(event) => onPayerNameChange(event.target.value)}
            aria-invalid={Boolean(payerNameError)}
            className="rounded-xl border-zinc-200 focus:border-orange-500 focus:ring-orange-500/20 dark:border-zinc-800"
            placeholder="Como quer ser chamado?"
          />
          {payerNameError ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {payerNameError}
            </p>
          ) : null}
        </div>

        {buyerEmail && (
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Acesso será vinculado ao e-mail: <br />
              <span className="font-bold text-foreground">{buyerEmail}</span>
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 dark:border-orange-900/20 dark:bg-orange-950/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Valor Total</span>
          <span className="text-2xl font-black tracking-tight">{formatBRL(total)}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border p-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-xs font-bold">Pagamento Seguro</p>
            <p className="truncate text-[10px] text-muted-foreground">Processado via Stripe</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border p-3">
          <Zap className="h-5 w-5 shrink-0 text-orange-600" />
          <div className="min-w-0">
            <p className="text-xs font-bold">Entrega Instantânea</p>
            <p className="truncate text-[10px] text-muted-foreground">Acesso após aprovação</p>
          </div>
        </div>
      </div>

      <Button
        onClick={onCheckout}
        disabled={isSubmitting}
        className="h-14 w-full gap-2 rounded-2xl bg-orange-600 text-base font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 hover:shadow-orange-700/30 active:scale-[0.98] transition-all disabled:opacity-70"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {status === "redirecting" ? "Redirecionando..." : "Iniciando Checkout..."}
          </span>
        ) : (
          <>
            Finalizar Compra <ArrowRight className="h-5 w-5" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Seus dados estão protegidos por criptografia de ponta a ponta
      </div>
    </div>
  );
}
