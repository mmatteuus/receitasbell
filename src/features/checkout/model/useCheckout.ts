import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CartItem } from "@/types/cart";
import { getRecipeBySlug } from "@/lib/repos/recipeRepo";
import { buildCartItemFromRecipe } from "@/lib/utils/recipeAccess";
import { paymentRepo } from "@/lib/repos/paymentRepo";
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
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(identityEmail);
  const checkoutReferenceRef = useRef<string>(createCheckoutReference());

  const paymentMethod = "stripe"; // Forçado para Stripe

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

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.priceBRL, 0),
    [items],
  );

  const isSubmitting =
    status === "validating" || status === "submitting" || status === "redirecting";

  const currentEmail = confirmedEmail || identityEmail;

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

    const buyerEmail = await ensureBuyerEmail("Digite seu e-mail para concluir a compra.");
    if (!buyerEmail) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");

    try {
      // O checkout agora redireciona para o Stripe Session correspondente ao recipeId único (ou lista)
      const targetSlug = recipeSlug || (items.length > 0 ? items[0].slug : "");
      
      const result = await paymentRepo.createCheckout({
        recipeIds: items.map((item) => item.recipeId),
        recipeSlug: targetSlug, 
        payerName: payerName.trim(),
        payerEmail: buyerEmail,
        checkoutReference: checkoutReferenceRef.current,
      });

      if (result.checkoutUrl) {
        setStatus("redirecting");
        toast.success("Redirecionando para o Stripe...");
        window.location.assign(result.checkoutUrl);
        return;
      }

      throw new Error("Resposta do servidor não contém URL de checkout.");
    } catch (error) {
      setStatus("error");
      logger.error("checkout", error);
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Não foi possível iniciar o pagamento via Stripe.",
      );
    }
  }, [
    ensureBuyerEmail,
    isSubmitting,
    items,
    payerName,
    recipeSlug
  ]);

  return {
    items,
    itemsLoading,
    payerName,
    payerNameError,
    total,
    status,
    isSubmitting,
    paymentMethod,
    currentEmail,
    setPayerName: setPayerNameValue,
    handleCheckout,
  };
}
