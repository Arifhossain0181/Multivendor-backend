import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import * as inventoryService from './inventory.service';

// ১. Get Variant Stock Details
export const getVariantStock = async (req: Request, res: Response) => {
    try {
        const { id: productId, vid: variantId } = req.params;

        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            select: {
                id: true,
                productId: true,
                sku: true,
                availableQty: true,
                attributes: true
            }
        });

        if (!variant || variant.productId !== productId) {
            return res.status(404).json({ success: false, error: 'Product variant not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Variant stock details fetched successfully',
            data: variant
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// ২. Update Variant Stock (Restock by Seller/Admin)
export const updateVariantStock = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id: productId, vid: variantId } = req.params;
        const { quantity } = req.body;

        // ওনারশিপ চেক: যে সেলার আপডেট করছে সে কি এই প্রোডাক্টের মালিক?
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { sellerId: true }
        });

        const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });

        if (!product || !sellerProfile || product.sellerId !== sellerProfile.id) {
            return res.status(403).json({ success: false, error: 'Forbidden: You do not own this product' });
        }

        // স্টক ওভাররাইট/আপডেট করা
        const updatedVariant = await prisma.productVariant.update({
            where: { id: variantId },
            data: { availableQty: quantity },
            select: { id: true, sku: true, availableQty: true }
        });

        return res.status(200).json({
            success: true,
            message: 'Variant stock updated successfully',
            data: updatedVariant
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};