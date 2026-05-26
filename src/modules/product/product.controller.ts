import { Request, Response } from 'express';
import * as productService from './product.service';
import { prisma } from '../../config/db';

export const createProduct = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // authenticate middleware 
        const { title, description, price, categoryId, variants } = req.body;

        // APProve sellerId Check
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId },
        });

        if (!sellerProfile || sellerProfile.status !== 'APPROVED') {
            return res.status(403).json({ 
                success: false, 
                error: 'Forbidden: Only approved sellers can add products.' 
            });
        }

        // Create product with variants in a transaction
        const product = await productService.createProductBySeller(
            sellerProfile.id,
            { title, description, price, categoryId },
            variants
        );

        return res.status(201).json({
            success: true,
            message: 'Product and variants created successfully by seller',
            data: product,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        });
    }
};