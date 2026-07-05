// order.controller.ts — BUG FIX: req.use.id -> req.user.id + proper pagination parsing

import { Request, Response } from 'express';
import * as orderService from './order.service';

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // FIXED: was req.use.id

        // parse to number with fallback defaults
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await orderService.getCustomerOrders(userId, page, limit);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error(`[Get Orders Error]`, error.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
};

export const getMyOrderDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const masterOrderId = req.params.id;

        const order = await orderService.getOrderDetails(userId, masterOrderId as string);

        return res.status(200).json({
            success: true,
            message: 'Order details retrieved successfully',
            data: order
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};