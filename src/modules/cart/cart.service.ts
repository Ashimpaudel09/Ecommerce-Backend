import { AppError } from '../../errors/app.error';
import { getProductById } from '../products/products.service';
import {
    addOrUpdateCartItem,
    getAllCartItems,
    getCartItem,
    removeCartItem,
    clearCart
} from '../../cache/cart.cache';
import { AddToCartInput, CartItemResponse, CartResponse, UpdateCartItemInput } from '../../types/cart';

export const addToCart = async (userId: string, data: AddToCartInput) => {
    // Ensure product exists
    const product = await getProductById(data.productId);

    if (!product) {
        throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    // Add to cart with increment logic
    await addOrUpdateCartItem(userId, data.productId, data.quantity, true);

    // Return the newly added/updated item
    const updatedItem = await getCartItem(userId, data.productId);
    return updatedItem;
};

export const getCart = async (userId: string): Promise<CartResponse> => {
    const items = await getAllCartItems(userId);

    const results = await Promise.all(
        items.map(async (item) => {
            try {
                const product = await getProductById(item.productId);

                return {
                    ...product,
                    quantity: item.quantity,
                };
            } catch (err) {
                if (err instanceof AppError && err.statusCode === 404) {
                    return null;
                }

                throw err;
            }
        })
    );

    const enrichedItems: CartItemResponse[] = results.filter((item): item is CartItemResponse => item !== null);
    return {
        items: enrichedItems,
        total: enrichedItems.length,
    };
};

export const updateCartItem = async (userId: string, productId: string, data: UpdateCartItemInput) => {
    const existingItem = await getCartItem(userId, productId);
    if (!existingItem) {
        throw new AppError('Item not found in cart', 404, 'NOT_FOUND');
    }

    // Update without incrementing
    await addOrUpdateCartItem(userId, productId, data.quantity, false);

    const updatedItem = await getCartItem(userId, productId);
    return updatedItem;
};

export const removeFromCart = async (userId: string, productId: string) => {
    await removeCartItem(userId, productId);
};

export const emptyCart = async (userId: string) => {
    await clearCart(userId);
};