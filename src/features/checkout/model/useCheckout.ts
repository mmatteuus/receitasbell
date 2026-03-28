import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CartItem } from "@/types/cart";
import type {
  CheckoutPaymentMethod,
  CreateCardPaymentInput,
  DirectPaymentResult,
  PaymentIdentification,
  PaymentStatus,
} from "@/types/payment";
import { getRecipeBySlug } from "@/lib/repos/recipeRepo";
import { buildCartItemFromRecipe } from "@/lib/utils/recipeAccess";
import { paymentRepo } from "@/lib/repos/paymentRepo";
import { resolveCheckoutResultPath } from "@/lib/payments/checkout";
import { ApiClientError } from "@/lib/api/client";
import { logger } from "@/lib/logger";

export type CheckoutStatus =
  | "idle"
  | "validating"
  | "submitting"
  | "redirecting"
  | "success"
  | "error";

type UseCheckoutInput = {
  recipeSlug: string | null;
  isCartCheckout: boolean;
  cartItems: CartItem[];
  clearCart: () => void;
  identityEmail: string | null;
  requireIdentity: (message?: string) => Promise<string | null>;
  navigate: (path: string) => void;
};

function createCheckoutReference() {
  return crypto.randomUUID();
}

function normalizeDocumentNumber(value: string) {
  return value.replace(/\D+/g, "");
}

function isPendingStatus(status: PaymentStatus) {
  return status === "pending" || status === "in_process";
}

export function useCheckout({
  recipeSlug,
  isCartCheckout,
  cartItems,
  clearCart,
  identityEmail,
  requireIdentity,
  navigate,
}: UseCheckoutInput) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [payerName, setPayerName] = useState("");
  const [payerNameError, setPayerNameError] = useState("");
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("checkout_pro");
  const [paymentConfig, setPaymentConfig] = useState<Awaited<ReturnType<typeof paymentRepo.getCheckoutConfig>> | null>(null);
  const [paymentConfigLoading, setPaymentConfigLoading] = useState(false);
  const [payerDocumentType, setPayerDocumentType] = useState<PaymentIdentification["type"]>("CPF");
  const [payerDocumentNumber, setPayerDocumentNumber] = useState("");
  const [pixPayment, setPixPayment] = useState<DirectPaymentResult | null>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixChecking, setPixChecking] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(identityEmail);
  const checkoutReferenceRef = useRef<string>(createCheckoutReference());

  useEffect(() => {
    if (identityEmail) {
      setConfirmedEmail(identityEmail);
    }
  }, [identityEmail]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecipes() {
      setItemsLoading(true);

      if (isCartCheckout) {
        if (isMounted) {
          setItems(cartItems);
          setItemsLoading(false);
        }
        return;
      }

      if (!recipeSlug) {
        if (isMounted) {
          setItems([]);
          setItemsLoading(false);
        }
        return;
      }

      try {
        const recipe = await getRecipeBySlug(recipeSlug);
        if (isMounted) {
          setItems(recipe ? [buildCartItemFromRecipe(recipe)] : []);
        }
      } catch (error) {
        logger.error("checkout.recipe", error);
        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setItemsLoading(false);
        }
      }
    }

    void loadRecipes();

    return () => {
      isMounted = false;
    };
  }, [cartItems, isCartCheckout, recipeSlug]);

  useEffect(() => {
    if (!confirmedEmail || payerName) {
      return;
    }

    setPayerName(confirmedEmail.split("@")[0]);
    setPayerNameError("");
  }, [confirmedEmail, payerName]);

  const itemsSignature = useMemo(() => items.map((item) => item.recipeId).join(","), [items]);

  useEffect(() => {
    checkoutReferenceRef.current = createCheckoutReference();
    setPixPayment(null);
    setPixDialogOpen(false);
    setPayerDocumentNumber("");
    setPayerDocumentType("CPF");
    setPaymentMethod("checkout_pro");
    setStatus("idle");
  }, [itemsSignature]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.priceBRL, 0),
    [items],
  );

  const isSubmitting =
    status === "validating" || status === "submitting" || status === "redirecting";

  const currentEmail = confirmedEmail || identityEmail;

  const navigateToResult = useCallback((nextStatus: PaymentStatus, paymentId?: string | null) => {
    const slug = items.length === 1 ? items[0].slug : "";
    const path = resolveCheckoutResultPath(nextStatus);
    navigate(
      `${path}?slug=${slug}&status=${nextStatus}&payment_id=${paymentId || ""}&count=${items.length}`,
    );
  }, [items, navigate]);

  const loadPaymentConfig = useCallback(async () => {
    if (paymentConfig) {
      return paymentConfig;
    }

    setPaymentConfigLoading(true);
    try {
      const config = await paymentRepo.getCheckoutConfig();
      setPaymentConfig(config);
      return config;
    } finally {
      setPaymentConfigLoading(false);
    }
  }, [paymentConfig]);

  const ensureBuyerEmail = useCallback(async (message: string) => {
    if (currentEmail) {
      return currentEmail;
    }

    const email = await requireIdentity(message);
    if (!email) {
      return null;
    }

    setConfirmedEmail(email);
    return email;
  }, [currentEmail, requireIdentity]);

  const setPayerNameValue = useCallback((value: string) => {
    setPayerName(value);
    setPayerNameError("");

    if (status === "error" || status === "success") {
      setStatus("idle");
    }
  }, [status]);

  const navigateFromDirectPayment = useCallback((result: DirectPaymentResult) => {
    if (result.internalStatus === "approved") {
      if (isCartCheckout) {
        clearCart();
      }
      setStatus("success");
      toast.success("Pagamento aprovado com sucesso.");
      navigateToResult("approved", result.paymentId);
      return;
    }

    if (isPendingStatus(result.internalStatus)) {
      setStatus("idle");
      navigateToResult(result.internalStatus, result.paymentId);
      return;
    }

    setStatus("error");
    navigateToResult(result.internalStatus, result.paymentId);
  }, [clearCart, isCartCheckout, navigateToResult]);

  const handlePaymentMethodChange = useCallback(async (nextMethod: CheckoutPaymentMethod) => {
    if (nextMethod === "card") {
      const email = await ensureBuyerEmail("Digite seu e-mail para pagar com cartão.");
      if (!email) {
        return;
      }

      try {
        const config = await loadPaymentConfig();
        if (!config.publicKey) {
          toast.error("A conta do Mercado Pago ainda não liberou cartão neste tenant.");
          return;
        }
      } catch (error) {
        logger.error("checkout.config", error);
        toast.error(
          error instanceof ApiClientError
            ? error.message
            : "Não foi possível preparar o pagamento com cartão.",
        );
        return;
      }
    }

    setPaymentMethod(nextMethod);
    if (status === "error" || status === "success") {
      setStatus("idle");
    }
  }, [ensureBuyerEmail, loadPaymentConfig, status]);

  const handleCheckout = useCallback(async () => {
    if (!items.length || isSubmitting || paymentMethod === "card") {
      return;
    }

    setStatus("validating");

    if (!payerName.trim()) {
      setPayerNameError("Informe o nome do pagador.");
      setStatus("error");
      return;
    }

    const buyerEmail = await ensureBuyerEmail("Digite seu e-mail para concluir a compra.");
    if (!buyerEmail) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");

    try {
      if (paymentMethod === "pix") {
        const documentNumber = normalizeDocumentNumber(payerDocumentNumber);
        if (documentNumber.length < 11) {
          setStatus("error");
          toast.error("Informe um CPF ou CNPJ válido para gerar o PIX.");
          return;
        }

        const result = await paymentRepo.createPix({
          recipeIds: items.map((item) => item.recipeId),
          payerName: payerName.trim(),
          buyerEmail,
          checkoutReference: checkoutReferenceRef.current,
          identification: {
            type: payerDocumentType,
            number: documentNumber,
          },
        });

        if (result.internalStatus === "approved") {
          if (isCartCheckout) {
            clearCart();
          }
          setStatus("success");
          navigateToResult("approved", result.paymentId);
          return;
        }

        if (isPendingStatus(result.internalStatus)) {
          setPixPayment(result);
          setPixDialogOpen(true);
          setStatus("idle");
          toast.success("PIX gerado. Faça o pagamento para liberar o acesso.");
          return;
        }

        navigateFromDirectPayment(result);
        return;
      }

      const result = await paymentRepo.createCheckout({
        recipeIds: items.map((item) => item.recipeId),
        items,
        payerName: payerName.trim() || buyerEmail.split("@")[0],
        payerEmail: buyerEmail,
        checkoutReference: checkoutReferenceRef.current,
      });

      if (result.checkoutUrl) {
        setStatus("redirecting");
        toast.success("Redirecionando para o checkout seguro do Mercado Pago...");
        window.location.assign(result.checkoutUrl);
        return;
      }

      if (isCartCheckout && result.status === "approved") {
        clearCart();
      }

      setStatus("success");
      toast.info("Criamos seu pedido. A confirmação final depende do Mercado Pago.");
      navigateToResult(result.status, result.paymentId);
    } catch (error) {
      setStatus("error");
      logger.error("checkout", error);
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Nao foi possivel concluir a compra.",
      );
    }
  }, [
    clearCart,
    ensureBuyerEmail,
    isCartCheckout,
    isSubmitting,
    items,
    navigateFromDirectPayment,
    navigateToResult,
    payerDocumentNumber,
    payerDocumentType,
    payerName,
    paymentMethod,
  ]);

  const handleCardPayment = useCallback(async (
    cardInput: Omit<CreateCardPaymentInput, "recipeIds" | "payerName" | "buyerEmail" | "checkoutReference">,
  ) => {
    if (!items.length || isSubmitting) {
      return;
    }

    setStatus("validating");

    if (!payerName.trim()) {
      setPayerNameError("Informe o nome do pagador.");
      setStatus("error");
      return;
    }

    const buyerEmail = await ensureBuyerEmail("Digite seu e-mail para pagar com cartão.");
    if (!buyerEmail) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");

    try {
      const result = await paymentRepo.createCard({
        recipeIds: items.map((item) => item.recipeId),
        payerName: payerName.trim(),
        buyerEmail,
        checkoutReference: checkoutReferenceRef.current,
        ...cardInput,
      });

      navigateFromDirectPayment(result);
    } catch (error) {
      setStatus("error");
      logger.error("checkout.card", error);
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Nao foi possivel processar o pagamento com cartao.",
      );
    }
  }, [
    ensureBuyerEmail,
    isSubmitting,
    items,
    navigateFromDirectPayment,
    payerName,
  ]);

  const copyPixCode = useCallback(async () => {
    if (!pixPayment?.qrCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pixPayment.qrCode);
      toast.success("Código PIX copiado.");
    } catch (error) {
      logger.error("checkout.pix.copy", error);
      toast.error("Não foi possível copiar o código PIX.");
    }
  }, [pixPayment]);

  useEffect(() => {
    if (!pixPayment || !isPendingStatus(pixPayment.internalStatus)) {
      setPixChecking(false);
      return;
    }

    let cancelled = false;
    let timerId: number | null = null;

    async function pollStatus() {
      setPixChecking(true);
      try {
        const latest = await paymentRepo.getStatus(String(pixPayment.paymentOrderId));
        if (cancelled) {
          return;
        }

        setPixPayment(latest);

        if (latest.internalStatus === "approved") {
          setPixDialogOpen(false);
          if (isCartCheckout) {
            clearCart();
          }
          toast.success("PIX confirmado. Acesso liberado.");
          navigateToResult("approved", latest.paymentId);
          return;
        }

        if (!isPendingStatus(latest.internalStatus)) {
          setPixDialogOpen(false);
          navigateToResult(latest.internalStatus, latest.paymentId);
          return;
        }

        timerId = window.setTimeout(() => {
          void pollStatus();
        }, 5000);
      } catch (error) {
        logger.error("checkout.pix.status", error);
        if (!cancelled) {
          timerId = window.setTimeout(() => {
            void pollStatus();
          }, 7000);
        }
      } finally {
        if (!cancelled) {
          setPixChecking(false);
        }
      }
    }

    timerId = window.setTimeout(() => {
      void pollStatus();
    }, 5000);

    return () => {
      cancelled = true;
      if (timerId != null) {
        window.clearTimeout(timerId);
      }
    };
  }, [clearCart, isCartCheckout, navigateToResult, pixPayment]);

  return {
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
    setPayerName: setPayerNameValue,
    setPayerDocumentType,
    setPayerDocumentNumber,
    setPixDialogOpen,
    handlePaymentMethodChange,
    handleCheckout,
    handleCardPayment,
    copyPixCode,
  };
}
