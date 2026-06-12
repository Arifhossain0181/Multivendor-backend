import { Request, Response } from 'express';
import * as sellerService from './seller.service';

// ১. Apply as a Seller
export const applyAsSeller = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { storeName, description } = req.body;

        const profile = await sellerService.createSellerProfile(userId, storeName, description);

        return res.status(201).json({
            success: true,
            message: 'Seller application submitted successfully',
            data: profile,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

// ২. Get Seller Profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const profile = await sellerService.findById(userId);

        return res.status(200).json({
            success: true,
            message: 'Seller profile retrieved successfully',
            data: profile,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

// ৩. Update Sub-Order Status (Seller Fulfillment)
export const updateSubOrderStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // কারেন্ট লগড-ইন সেলারের আইডি
        const subOrderId = req.params.id;
        const { status } = req.body;

        // প্রথমে ইউজারের সেলার প্রোফাইল আইডি বের করতে হবে
        const sellerProfile = await sellerService.findById(userId);
        
        const updatedSubOrder = await sellerService.transitionSubOrder(subOrderId, sellerProfile.id, status);

        return res.status(200).json({
            success: true,
            message: `Sub-order status updated to ${status} successfully`,
            data: updatedSubOrder,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};