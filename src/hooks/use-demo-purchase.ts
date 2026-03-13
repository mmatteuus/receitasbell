"use client";

import { createCheckout } from "@/lib/api/interactions";
import { useAppContext } from "@/contexts/app-context";

export function useDemoPurchase() {
  const { requireIdentity } = useAppContext();

  async function unlockRecipes(recipeIds: string[]) {
    const buyerEmail = await requireIdentity("Digite seu e-mail para concluir a compra.");
    if (!buyerEmail) return null;

    return createCheckout({
      recipeIds,
      buyerEmail,
      checkoutReference: crypto.randomUUID(),
    });
  }

  function isUnlocked(_recipeId: string, tier: "free" | "paid", unlocked?: boolean) {
    if (tier === "free") return true;
    return Boolean(unlocked);
  }

  return {
    unlockRecipes,
    isUnlocked,
  };
}
