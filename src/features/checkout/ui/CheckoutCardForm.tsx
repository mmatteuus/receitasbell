import { useEffect, useRef, useState } from "react";
import type { PaymentIdentification } from "@/types/payment";

type CheckoutCardFormSubmit = {
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
  identification: PaymentIdentification;
};

type CheckoutCardFormProps = {
  formId: string;
  publicKey: string;
  amountBRL: number;
  payerName: string;
  buyerEmail: string;
  onSubmit: (input: CheckoutCardFormSubmit) => Promise<void>;
};

const fieldClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20";

let sdkPromise: Promise<void> | null = null;

function loadMercadoPagoSdk() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.MercadoPago) {
    return Promise.resolve();
  }
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-sdk="mercadopago-js-v2"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar o SDK do Mercado Pago.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.dataset.sdk = "mercadopago-js-v2";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o SDK do Mercado Pago."));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export function CheckoutCardForm({
  formId,
  publicKey,
  amountBRL,
  payerName,
  buyerEmail,
  onSubmit,
}: CheckoutCardFormProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const cardFormRef = useRef<MercadoPagoCardFormInstance | null>(null);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    let cancelled = false;

    async function mountCardForm() {
      setReady(false);
      setError("");

      try {
        await loadMercadoPagoSdk();
        if (cancelled) return;
        if (!window.MercadoPago) {
          throw new Error("SDK do Mercado Pago indisponível.");
        }

        cardFormRef.current?.unmount?.();
        const mercadoPago = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        let instance: MercadoPagoCardFormInstance | null = null;

        instance = mercadoPago.cardForm({
          amount: amountBRL.toFixed(2),
          autoMount: true,
          form: {
            id: formId,
            cardholderName: { id: `${formId}__cardholderName` },
            cardholderEmail: { id: `${formId}__cardholderEmail` },
            cardNumber: { id: `${formId}__cardNumber` },
            securityCode: { id: `${formId}__securityCode` },
            expirationMonth: { id: `${formId}__expirationMonth` },
            expirationYear: { id: `${formId}__expirationYear` },
            issuer: { id: `${formId}__issuer` },
            installments: { id: `${formId}__installments` },
            identificationType: { id: `${formId}__identificationType` },
            identificationNumber: { id: `${formId}__identificationNumber` },
          },
          callbacks: {
            onFormMounted: (mountError?: { message?: string } | null) => {
              if (cancelled) return;
              if (mountError) {
                setError(mountError.message || "Não foi possível montar o formulário do cartão.");
                return;
              }
              setReady(true);
            },
            onSubmit: async (event: Event) => {
              event.preventDefault();
              const data = instance?.getCardFormData?.();
              if (!data?.token || !data.paymentMethodId || !data.identificationType || !data.identificationNumber) {
                setError("Preencha os dados do cartão e do documento antes de continuar.");
                return;
              }

              setError("");
              await onSubmitRef.current({
                token: data.token,
                paymentMethodId: data.paymentMethodId,
                issuerId: data.issuerId || undefined,
                installments: Number(data.installments || "1"),
                identification: {
                  type: data.identificationType === "CNPJ" ? "CNPJ" : "CPF",
                  number: data.identificationNumber,
                },
              });
            },
          },
        });

        cardFormRef.current = instance;
      } catch (sdkError) {
        if (!cancelled) {
          setError(sdkError instanceof Error ? sdkError.message : "Falha ao carregar o cartão.");
        }
      }
    }

    void mountCardForm();

    return () => {
      cancelled = true;
      cardFormRef.current?.unmount?.();
      cardFormRef.current = null;
    };
  }, [amountBRL, formId, publicKey]);

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Cartão de crédito</p>
        <p className="text-xs text-muted-foreground">
          Pagamento transparente pelo Mercado Pago sem redirecionamento.
        </p>
      </div>

      <form id={formId} className="space-y-3">
        <input id={`${formId}__cardholderName`} value={payerName} readOnly className="sr-only" tabIndex={-1} />
        <input id={`${formId}__cardholderEmail`} value={buyerEmail} readOnly className="sr-only" tabIndex={-1} />

        <div className="grid gap-3">
          <input id={`${formId}__cardNumber`} className={fieldClassName} placeholder="Número do cartão" />

          <div className="grid gap-3 sm:grid-cols-3">
            <input id={`${formId}__expirationMonth`} className={fieldClassName} placeholder="Mês" />
            <input id={`${formId}__expirationYear`} className={fieldClassName} placeholder="Ano" />
            <input id={`${formId}__securityCode`} className={fieldClassName} placeholder="CVV" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select id={`${formId}__issuer`} className={fieldClassName} defaultValue="" />
            <select id={`${formId}__installments`} className={fieldClassName} defaultValue="" />
          </div>

          <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <select id={`${formId}__identificationType`} className={fieldClassName} defaultValue="" />
            <input
              id={`${formId}__identificationNumber`}
              className={fieldClassName}
              placeholder="CPF ou CNPJ"
              inputMode="numeric"
            />
          </div>
        </div>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!ready && !error ? (
        <p className="text-xs text-muted-foreground">Preparando os campos seguros do cartão...</p>
      ) : null}
    </div>
  );
}
