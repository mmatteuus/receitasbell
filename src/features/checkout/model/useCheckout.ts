import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CartItem } from "@/types/cart";
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
  const checkoutReferenceRef = useRef<string>(createCheckoutReference());

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
    if (!identityEmail || payerName) {
      return;
    }

    setPayerName(identityEmail.split("@")[0]);
    setPayerNameError("");
  }, [identityEmail, payerName]);

  const itemsSignature = useMemo(() => items.map((item) => item.recipeId).join(","), [items]);

  useEffect(() => {
    checkoutReferenceRef.current = createCheckoutReference();
  }, [itemsSignature]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.priceBRL, 0),
    [items],
  );

  const isSubmitting =
    status === "validating" || status === "submitting" || status === "redirecting";

  const setPayerNameValue = useCallback((value: string) => {
    setPayerName(value);
    setPayerNameError("");

    if (status === "error" || status === "success") {
      setStatus("idle");
    }
  }, [status]);

  const handleCheckout = useCallback(async () => {
    if (!items.length || isSubmitting) {
      return;
    }

    setStatus("validating");

    if (!payerName.trim()) {
      setPayerNameError("Informe o nome do pagador.");
      setStatus("error");
      return;
    }

    setStatus("submitting");

    try {
      const buyerEmail = await requireIdentity("Digite seu e-mail para concluir a compra.");
      if (!buyerEmail) {
        setStatus("idle");
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

      const slug = items.length === 1 ? items[0].slug : "";
      const path = resolveCheckoutResultPath(result.status);
      navigate(
        `${path}?slug=${slug}&status=${result.status}&payment_id=${result.paymentId || ""}&count=${result.unlockedCount}`,
      );
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
    isCartCheckout,
    isSubmitting,
    items,
    navigate,
    payerName,
    requireIdentity,
  ]);

  return {
    items,
    itemsLoading,
    payerName,
    payerNameError,
    total,
    status,
    isSubmitting,
    setPayerName: setPayerNameValue,
    handleCheckout,
  };
}
