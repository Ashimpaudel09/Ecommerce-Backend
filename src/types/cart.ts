import { z } from 'zod';

export const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1)
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1)
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartItemResponse {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stock: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string, name: string, slug: string } | null;
}

export interface CartResponse {
  items: CartItemResponse[];
  total: number;
}
