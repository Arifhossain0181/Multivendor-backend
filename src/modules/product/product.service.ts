import { ApiError } from "../../utlits/ApiError.js";
import { prisma } from "../../prisma/client.js";
import { uploadImages } from "../../config/cloudinary.js";

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
    const primaryImage = product.imageUrls?.[0];
    const stock = Array.isArray(product.inventory)
        ? product.inventory.reduce((sum: number, item: any) => sum + toNumber(item.availableQty), 0)
        : 0;

    return {
        id: product.id,
        name: product.name,
        price: toNumber(primaryVariant?.price ?? 0),
        imageUrl: primaryImage ?? DEFAULT_PRODUCT_IMAGE_URL,
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
        images?: string[];
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

    // 2. Upload images to Cloudinary (convert base64 → CDN URLs)
    let imageUrls: string[] = [];
    if (productData.images?.length) {
        try {
            imageUrls = await uploadImages(productData.images, "products");
        } catch (uploadErr: any) {
            throw new ApiError(
                500,
                "IMAGE_UPLOAD_FAILED",
                `Failed to upload images: ${uploadErr.message}`
            );
        }
    }

    // 3. Transaction: Product + Variants
    return await prisma.$transaction(async (tx: any) => {
        // Create Product
        const product = await tx.product.create({
            data: {
                name: productData.title,
                description: productData.description,
                imageUrls,
                categoryId: productData.categoryId,
                sellerId,
                status: "DRAFT",
            },
        });

        // Create Variants (if exists)
        if (productData.variants?.length) {
            for (const variant of productData.variants) {
                const createdVariant = await tx.productVariant.create({
                    data: {
                        productId: product.id,
                        name: variant.attributes?.label ?? variant.sku,
                        sku: variant.sku,
                        price: Number(variant.attributes?.price ?? productData.price),
                    },
                });

                await tx.productInventory.create({
                    data: {
                        productId: product.id,
                        variantId: createdVariant.id,
                        availableQty: variant.availableQty,
                    },
                });
            }
        }

        return tx.product.findUnique({
            where: { id: product.id },
            include: {
                seller: true,
                category: true,
                variants: true,
                inventory: true,
            },
        });
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

export const updateProduct = async (
    id: string,
    productData: {
        title?: string;
        description?: string;
        price?: number;
        categoryId?: string;
        images?: string[];
        variants?: Array<{
            sku: string;
            attributes: any;
            availableQty: number;
        }>;
    }
) => {
    const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: { variants: true }
    });

    if (!existingProduct) {
        throw new ApiError(404, "NOT_FOUND", "Product not found");
    }

    if (productData.categoryId) {
        const categoryExists = await prisma.category.findUnique({
            where: { id: productData.categoryId },
        });
        if (!categoryExists) {
            throw new ApiError(404, "NOT_FOUND", "Category not found");
        }
    }

    let imageUrls: string[] | undefined = undefined;
    if (productData.images?.length) {
        try {
            const newImages = productData.images.filter((img: string) => img.startsWith("data:image/"));
            const existingImages = productData.images.filter((img: string) => !img.startsWith("data:image/"));
            
            let uploadedUrls: string[] = [];
            if (newImages.length) {
                uploadedUrls = await uploadImages(newImages, "products");
            }
            imageUrls = [...existingImages, ...uploadedUrls];
        } catch (uploadErr: any) {
            throw new ApiError(
                500,
                "IMAGE_UPLOAD_FAILED",
                `Failed to upload images: ${uploadErr.message}`
            );
        }
    }

    return await prisma.$transaction(async (tx: any) => {
        const updatedProduct = await tx.product.update({
            where: { id },
            data: {
                name: productData.title !== undefined ? productData.title : undefined,
                description: productData.description !== undefined ? productData.description : undefined,
                imageUrls: imageUrls !== undefined ? imageUrls : undefined,
                categoryId: productData.categoryId !== undefined ? productData.categoryId : undefined,
            },
        });

        if (productData.variants !== undefined) {
            await tx.productVariant.deleteMany({
                where: { productId: id }
            });

            if (productData.variants.length) {
                for (const variant of productData.variants) {
                    const createdVariant = await tx.productVariant.create({
                        data: {
                            productId: id,
                            name: variant.attributes?.label ?? variant.sku,
                            sku: variant.sku,
                            price: Number(variant.attributes?.price ?? productData.price ?? existingProduct.price ?? 0),
                        },
                    });

                    await tx.productInventory.create({
                        data: {
                            productId: id,
                            variantId: createdVariant.id,
                            availableQty: variant.availableQty,
                        },
                    });
                }
            }
        }

        return tx.product.findUnique({
            where: { id },
            include: {
                seller: true,
                category: true,
                variants: true,
                inventory: true,
            },
        });
    });
};

export const deleteProduct = async (id: string) => {
    const product = await prisma.product.findUnique({
        where: { id },
    });
    if (!product) {
        throw new ApiError(404, "NOT_FOUND", "Product not found");
    }
    return await prisma.product.delete({
        where: { id },
    });
};
