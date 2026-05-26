import { Request, Response } from 'express';
import * as cartService from './cart.service';

// ১. Get User Cart
export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const cart = await cartService.getCartWithItems(userId);

        return res.status(200).json({
            success: true,
            message: 'Cart retrieved successfully',
            data: cart
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

// ২. Add Item To Cart
export const addItemToCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { productId, variantId, quantity } = req.body;

        const cartItem = await cartService.addItem(userId, productId, variantId, quantity);

        return res.status(201).json({
            success: true,
            message: 'Item added to cart successfully',
            data: cartItem
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

// ৩. Remove Item From Cart
export const removeItemFromCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const cartItemId = req.params.id;

        await cartService.removeItem(userId, cartItemId);

        return res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully'
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

// ৪. Clear Entire Cart
export const emptyCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        await cartService.clearCart(userId);

        return res.status(200).json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};