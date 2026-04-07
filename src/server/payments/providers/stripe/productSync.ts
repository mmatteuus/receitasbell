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
    stripe_product_id?: string | null;
  }
) {
  // Somente sincronizar se for um produto pago
  if (recipe.accessTier !== "paid" || !recipe.priceBRL) return null;

  try {
    let product;

    // Se já temos um ID, tentamos buscar e atualizar
    if (recipe.stripe_product_id) {
        try {
            product = await stripeClient.products.update(recipe.stripe_product_id, {
                name: recipe.title,
                description: recipe.description || undefined,
                images: recipe.imageUrl ? [recipe.imageUrl] : [],
                metadata: {
                    tenantId,
                    recipeId: recipe.id,
                },
            }, { stripeAccount: stripeAccountId });
        } catch (e) {
            console.warn(`[Stripe Sync] Could not find product ${recipe.stripe_product_id}, creating new one.`);
        }
    }

    // Se não existia ou não foi encontrado, criar novo
    if (!product) {
        product = await stripeClient.products.create({
            name: recipe.title,
            description: recipe.description || undefined,
            images: recipe.imageUrl ? [recipe.imageUrl] : [],
            metadata: {
                tenantId,
                recipeId: recipe.id,
            },
        }, { stripeAccount: stripeAccountId });
    }

    // Para o preço, sempre criamos um novo se o valor mudar ou se for novo, 
    // pois Preços no Stripe são imutáveis (valor), usualmente arquivamos o antigo se necessário.
    const price = await stripeClient.prices.create({
      product: product.id,
      unit_amount: Math.round(recipe.priceBRL * 100), // in cents
      currency: "brl",
      metadata: {
        tenantId,
        recipeId: recipe.id,
      }
    }, { stripeAccount: stripeAccountId });

    return { productId: product.id, priceId: price.id };
  } catch (error) {
    console.error("Erro ao sincronizar receita com Stripe:", error);
    throw error;
  }
}
