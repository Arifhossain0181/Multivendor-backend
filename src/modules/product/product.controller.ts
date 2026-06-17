import { Request, Response } from "express";
import * as productService from "./product.service";
import { prisma } from "../../prisma/client";

export const createProduct = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const { title, description, price, categoryId, variants } = req.body;

        // 1. Check seller profile
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId },
        });

        if (!sellerProfile) {
            return res.status(404).json({
                success: false,
                error: "Seller profile not found",
            });
        }

        if (sellerProfile.status !== "APPROVED") {
            return res.status(403).json({
                success: false,
                error: "Only approved sellers can create products",
            });
        }

        // 2. Call service (ONLY 2 args via object)
        const product = await productService.createProductBySeller(
            sellerProfile.id,
            {
                title,
                description,
                price,
                categoryId,
                variants,
            }
        );

        // 3. Success response
        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });

    } catch (error: any) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error",
        });
    }
};