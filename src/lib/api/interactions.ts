import type { CartItem, Comment } from '@/types/recipe';
import type { PaymentStatus } from '@/types/payment';
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
  const result = await jsonFetch<{ comments: Comment[] }>(`/api/comments${query}`);
  return Array.isArray(result.comments) ? result.comments : [];
}

export async function createComment(input: { recipeId: string; authorName: string; text: string }) {
  const result = await jsonFetch<{ comment: Comment }>('/api/comments', {
    method: 'POST',
    body: input,
  });
  return result.comment;
}

export async function submitRating(input: { recipeId: string; value: number }) {
  return jsonFetch<RatingSummary>('/api/ratings', {
    method: 'POST',
    body: input,
  });
}

export async function listFavorites() {
  const result = await jsonFetch<{ favorites: FavoriteRecord[] }>('/api/favorites');
  return Array.isArray(result.favorites) ? result.favorites : [];
}

export async function addFavorite(recipeId: string) {
  const result = await jsonFetch<{ favorite: FavoriteRecord }>('/api/favorites', {
    method: 'POST',
    body: { recipeId },
  });
  return result.favorite;
}

export async function deleteFavorite(favoriteId: string) {
  await jsonFetch<void>(`/api/favorites/${encodeURIComponent(favoriteId)}`, {
    method: 'DELETE',
  });
}

export async function listShoppingList() {
  const result = await jsonFetch<{ items: ShoppingListItem[] }>('/api/shopping-list');
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
  const result = await jsonFetch<{ items: ShoppingListItem[] }>('/api/shopping-list', {
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
    `/api/shopping-list/${encodeURIComponent(itemId)}`,
    {
      method: 'PUT',
      body: patch,
    }
  );
  return result.item;
}

export async function deleteShoppingListItem(itemId: string) {
  await jsonFetch<void>(`/api/shopping-list/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
}

export async function subscribeToNewsletter(input: {
  email: string;
  name?: string;
  source?: string;
}) {
  const result = await jsonFetch<{ subscriber: { email: string } }>('/api/newsletter', {
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
  return jsonFetch<{
    payment: { id: string } | null;
    payments: Array<{ id: string; external_reference?: string }>;
    paymentId: string | null;
    paymentIds: string[];
    primaryPaymentId: string | null;
    status: PaymentStatus;
    unlockedCount: number;
    preferenceId?: string | null;
    initPoint?: string | null;
    sandboxInitPoint?: string | null;
  }>('/api/checkout', {
    method: 'POST',
    body: input,
  });
}
