import { Request, Response } from 'express';
import * as reviewService from './review.service.js';

export const createReview = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { productId, rating, comment } = req.body;

        const review = await reviewService.addProductReview(userId, productId, rating, comment);

        return res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};
