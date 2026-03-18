'use client';

import { useAppContext } from '@/contexts/app-context';
import { paymentRepo } from '@/lib/repos/paymentRepo';

export function useDemoPurchase() {
  const { requireIdentity } = useAppContext();

  async function unlockRecipes(recipeIds: string[]) {
    const buyerEmail = await requireIdentity('Digite seu e-mail para concluir a compra.');
    if (!buyerEmail) return null;

    return paymentRepo.createCheckout({
      recipeIds,
      payerEmail: buyerEmail,
      checkoutReference: crypto.randomUUID(),
    });
  }

  function isUnlocked(_recipeId: string, tier: 'free' | 'paid', unlocked?: boolean) {
    if (tier === 'free') return true;
    return Boolean(unlocked);
  }

  return {
    unlockRecipes,
    isUnlocked,
  };
}
