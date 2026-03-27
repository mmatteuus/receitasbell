import type { CartItem } from '@/types/cart';
import type { Comment } from '@/types/recipe';
import type { CreatePaymentPreferenceResult } from '@/types/payment';
import { buildQuery, jsonFetch } from './client';

export interface FavoriteRecord {
  id: string;
  recipeId: string;
  userId: string;
  createdAt: string;
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
  const result = await jsonFetch<{ items?: FavoriteRecord[]; favorites?: FavoriteRecord[] }>('/api/me/favorites');
  return Array.isArray(result.items) ? result.items : Array.isArray(result.favorites) ? result.favorites : [];
}

export async function addFavorite(recipeId: string) {
  const result = await jsonFetch<{ favorite?: FavoriteRecord } & Partial<FavoriteRecord>>('/api/me/favorites', {
    method: 'POST',
    body: { recipeId },
  });
  if (result.favorite) return result.favorite;
  return result as FavoriteRecord;
}

export async function deleteFavorite(recipeId: string) {
  await jsonFetch<void>(`/api/me/favorites${buildQuery({ recipeId })}`, {
    method: 'DELETE',
  });
}

export async function listShoppingList() {
  const result = await jsonFetch<{ items: ShoppingListItem[] }>('/api/me/shopping-list');
  return Array.isArray(result.items) ? result.items : [];
}

export async function createShoppingListItems(
  items: Array<{
    recipeId?: string | null;
    recipeTitleSnapshot?: string;
    text: string;
    checked?: boolean;
  }>
) {
  const result = await jsonFetch<{ items: ShoppingListItem[] }>('/api/me/shopping-list', {
    method: 'POST',
    body: { items },
  });
  return result.items;
}

export async function updateShoppingListItem(
  itemId: string,
  patch: Partial<Pick<ShoppingListItem, 'text' | 'checked'>>
) {
  const result = await jsonFetch<{ item: ShoppingListItem }>(
    `/api/me/shopping-list${buildQuery({ id: itemId })}`,
    {
      method: 'PUT',
      body: patch,
    }
  );
  return result.item;
}

export async function deleteShoppingListItem(itemId: string) {
  await jsonFetch<void>(`/api/me/shopping-list${buildQuery({ id: itemId })}`, {
    method: 'DELETE',
  });
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
  items?: CartItem[];
  payerName?: string;
  buyerEmail: string;
  checkoutReference: string;
}) {
  return jsonFetch<CreatePaymentPreferenceResult>('/api/checkout', {
    method: 'POST',
    body: input,
  });
}
