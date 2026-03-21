export interface CartItem {
  recipeId: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  priceBRL: number;
  quantity: number;
}
