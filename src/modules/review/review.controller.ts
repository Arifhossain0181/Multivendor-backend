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
        const { id } = req.params;
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
        const { productId } = req.params;

        const result = await reviewService.getProductReviews(productId);

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

export const getSellerReviews = async (req: Request, res: Response) => {
    try {
        const { sellerId } = req.params;

        const result = await reviewService.getSellerReviews(sellerId);

        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

export const getMyReviews = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const reviews = await reviewService.getMyReviews(userId);

        return res.status(200).json({ success: true, data: reviews });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};
