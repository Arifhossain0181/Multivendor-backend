import { Request, Response } from 'express';
import * as reviewService from './review.service.js';

export const createReview = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { productId, rating, comment, sellerRating } = req.body;

        const review = await reviewService.addProductReview(userId, productId, rating, comment, sellerRating);

        return res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

export const replyReview = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const id = typeof req.params.id === 'string' ? req.params.id : Array.isArray(req.params.id) ? req.params.id[0] : '';
        const { reply } = req.body;

        const review = await reviewService.replyToReview(userId, id, reply);

        return res.status(200).json({ success: true, message: 'Reply added successfully', data: review });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

export const getProductReviews = async (req: Request, res: Response) => {
    try {
        const productId = typeof req.params.productId === 'string' ? req.params.productId : Array.isArray(req.params.productId) ? req.params.productId[0] : '';
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await reviewService.getProductReviews(productId, cursor, limit);

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

export const getSellerReviews = async (req: Request, res: Response) => {
    try {
        const sellerId = typeof req.params.sellerId === 'string' ? req.params.sellerId : Array.isArray(req.params.sellerId) ? req.params.sellerId[0] : '';
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await reviewService.getSellerReviews(sellerId, cursor, limit);

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

export const getMyReviews = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = parseInt(req.query.limit as string) || 10;

        const reviews = await reviewService.getMyReviews(userId, cursor, limit);

        return res.status(200).json({ success: true, data: reviews });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};
