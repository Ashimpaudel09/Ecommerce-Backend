import { Request, Response, NextFunction } from 'express';
import { AddToCartSchema, UpdateCartItemSchema } from '../../types/cart';
import * as cartService from './cart.service';

export const addToCartHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = AddToCartSchema.parse(req.body);
        const item = await cartService.addToCart(userId, data);
        res.status(200).json({ message: 'Item added to cart', item });
    } catch (error) {
        next(error);
    }
};

export const getCartHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const cart = await cartService.getCart(userId);
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

export const updateCartItemHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { productId } = req.params as { productId: string };
        const data = UpdateCartItemSchema.parse(req.body);
        const item = await cartService.updateCartItem(userId, productId, data);
        res.status(200).json({ message: 'Cart updated', item });
    } catch (error) {
        next(error);
    }
};

export const removeFromCartHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { productId } = req.params as { productId: string };
        await cartService.removeFromCart(userId, productId);
        res.status(200).json({ message: 'Item removed from cart' });
    } catch (error) {
        next(error);
    }
};

export const clearCartHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        await cartService.emptyCart(userId);
        res.status(200).json({ message: 'Cart cleared' });
    } catch (error) {
        next(error);
    }
};
