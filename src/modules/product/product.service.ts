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

const getInventoryQuantity = (inventory: any) => {
    if (!inventory) return 0;

    if (Array.isArray(inventory)) {
        return inventory.reduce(
            (sum: number, item: any) => sum + toNumber(item?.availableQty),
            0
        );
    }

    return toNumber(inventory.availableQty);
};

const mapProduct = (product: any) => {
    const primaryVariant = product.variants?.[0];
    const primaryImage = product.imageUrls?.[0];
    const stock = getInventoryQuantity(product.inventory);

    const viewCount = product._count?.views ?? 0;
    const reviewCount = product._count?.reviews ?? product.reviews?.length ?? 0;
    const averageRating = product.reviews?.length 
        ? product.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / product.reviews.length
        : 0;

    const sizes = Array.from(new Set(product.variants?.map((v: any) => v.name) || [])).filter(Boolean);
    const colors = ["Standard"];

    return {
        id: product.id,
        name: product.name,
        price: toNumber(primaryVariant?.price ?? 0),
        imageUrl: primaryImage ?? DEFAULT_PRODUCT_IMAGE_URL,
        imageUrls: product.imageUrls ?? [],
        description: product.description,
        stock,
        categoryId: product.categoryId,
        variants: (product.variants ?? []).map((variant: any) => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: toNumber(variant.price),
        })),
        viewCount,
        reviewCount,
        averageRating,
        sizes: sizes.length ? sizes : ["Default"],
        colors,
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
                reviews: {
                    select: { rating: true }
                },
                _count: {
                    select: { views: true, reviews: true }
                }
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
    // Try ACTIVE first; fall back to any status so admins can load DRAFT products for editing
    const product = await prisma.product.findFirst({
        where: { id },
        include: {
            variants: true,
            inventory: true,
            reviews: {
                select: { rating: true }
            },
            _count: {
                select: { views: true, reviews: true }
            }
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
        // 1. Update product core fields
        await tx.product.update({
            where: { id },
            data: {
                name: productData.title !== undefined ? productData.title : undefined,
                description: productData.description !== undefined ? productData.description : undefined,
                imageUrls: imageUrls !== undefined ? imageUrls : undefined,
                categoryId: productData.categoryId !== undefined ? productData.categoryId : undefined,
            },
        });

        // 2. Handle variants safely via UPSERT (never delete variants that may be in orders/cart)
        if (productData.variants !== undefined && productData.variants.length > 0) {
            for (const variant of productData.variants) {
                const price = Number(
                    variant.attributes?.price ??
                    productData.price ??
                    existingProduct.variants?.[0]?.price ??
                    0
                );
                const variantName = variant.attributes?.label ?? variant.sku;

                // Upsert by SKU — update if exists, create if not
                const existingVariant = await tx.productVariant.findFirst({
                    where: { productId: id, sku: variant.sku },
                });

                let variantId: string;

                if (existingVariant) {
                    // Update existing variant in-place (preserves FK refs from orders/cart)
                    await tx.productVariant.update({
                        where: { id: existingVariant.id },
                        data: { name: variantName, price },
                    });
                    variantId = existingVariant.id;
                } else {
                    // Create brand-new variant
                    const created = await tx.productVariant.create({
                        data: {
                            productId: id,
                            name: variantName,
                            sku: variant.sku,
                            price,
                        },
                    });
                    variantId = created.id;
                }

                // Upsert inventory for this variant
                const existingInventory = await tx.productInventory.findUnique({
                    where: { variantId },
                });

                if (existingInventory) {
                    await tx.productInventory.update({
                        where: { variantId },
                        data: { availableQty: variant.availableQty },
                    });
                } else {
                    await tx.productInventory.create({
                        data: {
                            productId: id,
                            variantId,
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

export const getMyProducts = async (userId: string, page = 1, pageSize = 12) => {
    const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
    });

    if (!sellerProfile) {
        return {
            data: [],
            meta: {
                page: 1,
                pageSize,
                total: 0,
                totalPages: 0,
            },
        };
    }

    const take = Math.max(1, Math.min(pageSize, 50));
    const skip = (Math.max(1, page) - 1) * take;

    const [total, products] = await prisma.$transaction([
        prisma.product.count({ where: { sellerId: sellerProfile.id } }),
        prisma.product.findMany({
            where: { sellerId: sellerProfile.id },
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
