import { z } from 'zod';

const imageFileMetaSchema = z.object({
  storage: z.enum(['baserow', 'external', 'fallback']),
  fileId: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.number().int().nonnegative(),
  uploadedAt: z.string().trim().min(1),
  publicUrl: z.string().trim().url(),
  thumbnailUrl: z.string().trim().url().nullable().optional(),
  driveFolderId: z.string().trim().nullable().optional(),
});

export const recipeMutationSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().optional(),
  title: z.string().trim().min(1),
  description: z.string().optional().default(''),
  imageUrl: z.string().trim().url().or(z.literal('')).optional().default(''),
  imageFileMeta: imageFileMetaSchema.nullable().optional(),
  categorySlug: z.string().trim().min(1),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  prepTime: z.number().int().nonnegative().optional().default(0),
  cookTime: z.number().int().nonnegative().optional().default(0),
  servings: z.number().int().positive().optional().default(1),
  difficulty: z.enum(['Fácil', 'Médio', 'Difícil']).nullable().optional(),
  calories: z.number().int().nonnegative().nullable().optional(),
  videoUrl: z.string().trim().url().or(z.literal('')).nullable().optional(),
  accessTier: z.enum(['free', 'paid']).optional().default('free'),
  priceBRL: z.number().nonnegative().nullable().optional(),
  fullIngredients: z.array(z.string()).optional().default([]),
  fullInstructions: z.array(z.string()).optional().default([]),
  publishedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  createdByUserId: z.string().nullable().optional(),
  excerpt: z.string().optional().default(''),
  seoTitle: z.string().optional().default(''),
  seoDescription: z.string().optional().default(''),
  isFeatured: z.boolean().optional().default(false),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
});

export const commentSchema = z.object({
  recipeId: z.string().trim().min(1),
  authorName: z.string().trim().min(1),
  text: z.string().trim().min(1),
});

export const ratingSchema = z.object({
  recipeId: z.string().trim().min(1),
  value: z.number().int().min(1).max(5),
});

export const favoriteSchema = z.object({
  recipeId: z.string().trim().min(1),
});

export const settingsSchema = z.object({
  settings: z.record(z.string(), z.union([z.string(), z.boolean(), z.number(), z.null()])),
});

export const noteSchema = z.object({
  note: z.string().trim().min(1),
});

export const shoppingListCreateSchema = z.object({
  items: z
    .array(
      z.object({
        clientId: z.string().trim().optional(),
        recipeId: z.string().trim().optional().nullable(),
        recipeTitleSnapshot: z.string().trim().optional(),
        text: z.string().trim().min(1),
        checked: z.boolean().optional(),
        updatedAt: z.string().trim().optional(),
      })
    )
    .min(1),
});

export const shoppingListUpdateSchema = z.object({
  clientId: z.string().trim().optional(),
  text: z.string().trim().min(1).optional(),
  checked: z.boolean().optional(),
  baseVersion: z.string().trim().optional(),
  updatedAt: z.string().trim().optional(),
});

export const checkoutCreateSchema = z.object({
  recipeIds: z.array(z.string().trim().min(1)).min(1),
  buyerEmail: z.string().trim().email(),
  payerName: z.string().trim().optional(),
  checkoutReference: z.string().trim().optional(),
});

export const uploadRecipeImageSchema = z.object({
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  dataBase64: z.string().trim().min(1),
});

export const newsletterSchema = z.object({
  email: z.string().email().trim(),
  name: z.string().trim().optional(),
  source: z.string().trim().optional(),
});
