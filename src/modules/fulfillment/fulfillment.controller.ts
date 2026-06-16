import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import * as fulfillmentService from './fulfillment.service';

// ১. Get Sub-Orders Dashboard for Seller
export const getMyFulfillments = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // Seller Profile check and approval status check
        const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });
        if (!sellerProfile || sellerProfile.status !== 'APPROVED') {
            return res.status(403).json({ success: false, error: 'Forbidden: Only approved sellers can view fulfillments' });
        }

        const result = await fulfillmentService.getSellerSubOrders(sellerProfile.id, page, limit);

        return res.status(200).json({
            success: true,
            message: 'Seller sub-orders retrieved successfully',
            data: result.subOrders,
            meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

// ২. Update Sub-Order Status
export const updateFulfillmentStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const subOrderId = req.params.id;
        const { status } = req.body;

        const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });
        if (!sellerProfile || sellerProfile.status !== 'APPROVED') {
            return res.status(403).json({ success: false, error: 'Forbidden: Unauthorized seller profile' });
        }

        const updatedSubOrder = await fulfillmentService.transitionSubOrderStatus(subOrderId as string, sellerProfile.id, status);

        return res.status(200).json({
            success: true,
            message: `Sub-order successfully transitioned to ${status}`,
            data: updatedSubOrder
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};