import { z } from 'zod';

// ------------------------------------------------------------------
// Create / Update
// ------------------------------------------------------------------

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  stock: z.number().int().min(0),
  categoryId: z.string().uuid().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ------------------------------------------------------------------
// Query / Filtering
// ------------------------------------------------------------------

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['priceCents', 'createdAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ------------------------------------------------------------------
// TypeScript types
// ------------------------------------------------------------------

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;