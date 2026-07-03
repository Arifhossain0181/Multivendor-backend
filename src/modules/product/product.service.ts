import { ApiError } from "../../utlits/ApiError.js";
import { prisma } from "../../prisma/client.js";

const DEFAULT_PRODUCT_IMAGE_URL = "/globe.svg";

const toNumber = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "bigint") return Number(value);
    if (value && typeof value === "object" && "toString" in value) {
        const parsed = Number(value.toString());
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const mapProduct = (product: any) => {
    const primaryVariant = product.variants?.[0];
    const stock = Array.isArray(product.inventory)
        ? product.inventory.reduce((sum: number, item: any) => sum + toNumber(item.availableQty), 0)
        : 0;

    return {
        id: product.id,
        name: product.name,
        price: toNumber(primaryVariant?.price ?? 0),
        imageUrl: product.imageUrl ?? DEFAULT_PRODUCT_IMAGE_URL,
        description: product.description,
        stock,
        variants: (product.variants ?? []).map((variant: any) => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: toNumber(variant.price),
        })),
    };
};

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

export const getPublicProducts = async (page = 1, pageSize = 12) => {
    const take = Math.max(1, Math.min(pageSize, 50));
    const skip = (Math.max(1, page) - 1) * take;

    const [total, products] = await prisma.$transaction([
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.product.findMany({
            where: { status: "ACTIVE" },
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: {
                variants: true,
                inventory: true,
            },
        }),
    ]);

    return {
        data: products.map(mapProduct),
        meta: {
            page: Math.max(1, page),
            pageSize: take,
            total,
            totalPages: Math.max(1, Math.ceil(total / take)),
        },
    };
};

export const getPublicProductById = async (id: string) => {
    const product = await prisma.product.findFirst({
        where: { id, status: "ACTIVE" },
        include: {
            variants: true,
            inventory: true,
        },
    });

    if (!product) {
        throw new ApiError(404, "NOT_FOUND", "Product not found");
    }

    return mapProduct(product);
};