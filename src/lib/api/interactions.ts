import type { CartItem } from '@/types/cart';
import type { Comment } from '@/types/recipe';
import type { CreatePaymentPreferenceResult } from '@/types/payment';
import { buildQuery, jsonFetch } from './client';

async function loadFavoritesRepo() {
  return import('@/pwa/offline/repos/favorites-offline-repo');
}

async function loadShoppingRepo() {
  return import('@/pwa/offline/repos/shopping-offline-repo');
}

export interface FavoriteRecord {
  id: string;
  recipeId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  avg: number;
  count: number;
  userValue: number | null;
}

export interface ShoppingListItem {
  id: string;
  userId: string;
  recipeId: string | null;
  recipeTitleSnapshot: string;
  text: string;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  serverId?: string | null;
}

export async function listComments(recipeId: string) {
  const query = buildQuery({ recipeId });
  const result = await jsonFetch<{ items?: Comment[]; comments?: Comment[] }>(`/api/public/comments${query}`);
  return Array.isArray(result.items) ? result.items : Array.isArray(result.comments) ? result.comments : [];
}

export async function createComment(input: { recipeId: string; authorName: string; text: string }) {
  const result = await jsonFetch<{ item?: Comment; comment?: Comment }>('/api/public/comments', {
    method: 'POST',
    body: input,
  });
  if (result.item) return result.item;
  if (result.comment) return result.comment;
  throw new Error("Comment response payload is missing.");
}

export async function submitRating(input: { recipeId: string; value: number }) {
  return jsonFetch<RatingSummary>('/api/public/ratings', {
    method: 'POST',
    body: input,
  });
}

export async function listFavorites() {
  const { listFavoritesOfflineAware } = await loadFavoritesRepo();
  return listFavoritesOfflineAware();
}

export async function addFavorite(recipeId: string) {
  const { addFavoriteOfflineAware } = await loadFavoritesRepo();
  return addFavoriteOfflineAware(recipeId);
}

export async function deleteFavorite(recipeId: string) {
  const { deleteFavoriteOfflineAware } = await loadFavoritesRepo();
  await deleteFavoriteOfflineAware(recipeId);
}

export async function listShoppingList() {
  const { listShoppingItemsOfflineAware } = await loadShoppingRepo();
  return listShoppingItemsOfflineAware();
}

export async function createShoppingListItems(
  items: Array<{
    recipeId?: string | null;
    recipeTitleSnapshot?: string;
    text: string;
    checked?: boolean;
  }>
) {
  const { createShoppingItemsOfflineAware } = await loadShoppingRepo();
  return createShoppingItemsOfflineAware(items);
}

export async function updateShoppingListItem(
  itemId: string,
  patch: Partial<Pick<ShoppingListItem, 'text' | 'checked'>>
) {
  const { updateShoppingItemOfflineAware } = await loadShoppingRepo();
  return updateShoppingItemOfflineAware(itemId, patch);
}

export async function deleteShoppingListItem(itemId: string) {
  const { deleteShoppingItemOfflineAware } = await loadShoppingRepo();
  await deleteShoppingItemOfflineAware(itemId);
}

export async function subscribeToNewsletter(input: {
  email: string;
  name?: string;
  source?: string;
}) {
  const result = await jsonFetch<{ subscriber: { email: string } }>('/api/public/newsletter', {
    method: 'POST',
    body: input,
  });
  return result.subscriber;
}

export async function createCheckout(input: {
  recipeIds: string[];
  recipeSlug?: string;
  items?: CartItem[];
  payerName?: string;
  userId: string;
  checkoutReference: string;
}) {
  return jsonFetch<CreatePaymentPreferenceResult>('/api/payments/checkout/session', {
    method: 'POST',
    body: input,
  });
}
