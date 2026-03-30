import { stripeClient } from "./client.js";

export async function syncStripeProduct(
  tenantId: string, 
  stripeAccountId: string,
  recipe: {
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    accessTier?: 'free' | 'paid' | 'all' | null;
    priceBRL?: number | null;
  }
) {
  // Somente sincronizar se for um produto pago
  if (recipe.accessTier !== "paid" || !recipe.priceBRL) return null;

  try {
    const product = await stripeClient.products.create({
      name: recipe.title,
      description: recipe.description || undefined,
      images: recipe.imageUrl ? [recipe.imageUrl] : [],
      metadata: {
        tenantId,
        recipeId: recipe.id,
      },
      // Criamos no conected account 
      // Não fazemos isso com Stripe-Account header pra products pois usualmente
      // a plataforma pode criar no próprio main e cobrar no destination charge
      // Mas se o requirement for direct charges, usaríamos stripeAccount.
    });

    const price = await stripeClient.prices.create({
      product: product.id,
      unit_amount: Math.round(recipe.priceBRL * 100), // in cents
      currency: "brl",
      lookup_key: recipe.id, // important to resolve via lookup_key
      metadata: {
        tenantId,
        recipeId: recipe.id,
      }
    });

    return { productId: product.id, priceId: price.id };
  } catch (error) {
    console.error("Erro ao sincronizar receita com Stripe:", error);
    throw error; // Or swallow it depending on requirements
  }
}
