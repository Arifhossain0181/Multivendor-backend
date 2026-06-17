import { ApiError } from "../../utlits/ApiError.js";
import { prisma } from "../../prisma/client.js";

export const createProductBySeller = async (
    sellerId: string,
    productData: {
        title: string;
        description: string;
        price: number;
        categoryId: string;
        variants?: Array<{
            sku: string;
            attributes: any;
            availableQty: number;
        }>;
    }
) => {
    // 1. Check category exists
    const categoryExists = await prisma.category.findUnique({
        where: { id: productData.categoryId },
    });

    if (!categoryExists) {
        throw new ApiError(404, "not found","Category not found");
    }

    // 2. Transaction: Product + Variants
    return await prisma.$transaction(async (tx:any) => {
        // Create Product
        const product = await tx.product.create({
            data: {
                title: productData.title,
                description: productData.description,
                price: productData.price,
                categoryId: productData.categoryId,
                sellerId,
                status: "DRAFT",
            },
        });

        // Create Variants (if exists)
        if (productData.variants?.length) {
            await tx.variant.createMany({
                data: productData.variants.map((v) => ({
                    productId: product.id,
                    sku: v.sku,
                    attributes: v.attributes,
                    availableQty: v.availableQty,
                })),
            });
        }

        return product;
    });
};