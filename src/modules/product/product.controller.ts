import { Request, Response } from "express";
import * as productService from "./product.service";
import { prisma } from "../../prisma/client";
import fs from "fs";
import path from "path";

const parsePageParam = (value: unknown, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user as { id: string; role?: string };
        const userId = user.id;

        const { title, description, price, categoryId, images, variants } = req.body;

        // 1. Find the seller profile for sellers/admins, or create one automatically for first-time users
        let sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId },
        });

        if (!sellerProfile) {
            const owner = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true },
            });

            sellerProfile = await prisma.sellerProfile.create({
                data: {
                    userId,
                    shopName: owner?.name ? `${owner.name} Store` : (user.role === "ADMIN" ? "Admin Store" : "Seller Store"),
                    description: owner?.email
                        ? `Managed by ${user.role === "ADMIN" ? "admin" : "seller"} (${owner.email})`
                        : "Auto-created profile",
                    status: user.role === "ADMIN" ? "APPROVED" : "PENDING",
                },
            });
        }

        if ((sellerProfile.status === "REJECTED" || sellerProfile.status === "PENDING") && user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                error: "Your seller account is not approved and cannot create products.",
            });
        }

        const productStatus = sellerProfile.status === "APPROVED" || user.role === "ADMIN" ? "ACTIVE" : "DRAFT";

        // 2. Call service (ONLY 2 args via object)
        const product = await productService.createProductBySeller(
            sellerProfile.id,
            {
                title,
                description,
                price,
                categoryId,
                images,
                variants,
                status: productStatus,
            }
        );

        // 3. Success response
        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });

    } catch (error: any) {
        try {
            fs.appendFileSync(
                path.join(process.cwd(), "dev.err.log"),
                new Date().toISOString() + " CREATE_PRODUCT_ERROR: " + (error.stack || error.message || String(error)) + "\n"
            );
        } catch (e) { }

        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error",
        });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, price, categoryId, images, variants } = req.body;

        if (typeof id !== "string" || !id) {
            return res.status(400).json({
                success: false,
                error: "Invalid product id",
            });
        }

        const product = await productService.updateProduct(id, {
            title,
            description,
            price,
            categoryId,
            images,
            variants,
        });

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    } catch (error: any) {
        // Always log the real error to the terminal
        console.error("[UPDATE_PRODUCT_ERROR]", error?.stack || error?.message || error);

        try {
            fs.appendFileSync(
                path.join(process.cwd(), "dev.err.log"),
                new Date().toISOString() + " UPDATE_PRODUCT_ERROR: " + (error.stack || error.message || String(error)) + "\n"
            );
        } catch (e) { }

        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error",
        });
    }
};

export const listProducts = async (req: Request, res: Response) => {
    try {
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = parsePageParam(req.query.limit, 12);
        const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;

        const result = await productService.getPublicProducts(cursor, limit, categoryId);

        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error",
        });
    }
};

export const getProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await productService.getPublicProductById(id as string);

        return res.status(200).json(product);
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error",
        });
    }
};

export const getMyProducts = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = parsePageParam(req.query.limit, 12);

        const result = await productService.getMyProducts(userId, cursor, limit);

        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error",
        });
    }
};

export const visualSearchProducts = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Image file is required",
            });
        }

        const buffer = await fs.promises.readFile(req.file.path);
        const result = await productService.searchProductsByImage(buffer, req.file.mimetype);

        return res.status(200).json({
            success: true,
            data: {
                items: result.map((item) => ({
                    ...item.product,
                    similarity: item.similarity,
                })),
                total: result.length,
            },
        });
    } catch (error: any) {
        const message = error?.stack || error?.message || String(error) || "Unknown error";
        console.error("[VISUAL_SEARCH_ERROR]", message);

        try {
            fs.appendFileSync(
                path.join(process.cwd(), "dev.err.log"),
                new Date().toISOString() + " VISUAL_SEARCH_ERROR: " + message + "\n"
            );
        } catch (e) {
            console.error("[VISUAL_SEARCH_LOG_ERROR]", e);
        }

        return res.status(error?.statusCode || 500).json({
            success: false,
            error: message,
        });
    }
};
