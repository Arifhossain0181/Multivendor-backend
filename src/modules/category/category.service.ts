
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utlits/ApiError.js';
import { uploadImage } from '../../config/cloudinary.js';

export const createCategory = async(name: string, slug: string , imageUrl?: string) => {
    const existingCategory = await prisma.category.findUnique({
        where: { slug },
    })
    if (existingCategory) {
        throw new Error('Category with this slug already exists');
    }

    let uploadedImageUrl: string | undefined;
    if (imageUrl && imageUrl.startsWith('data:image/')) {
        uploadedImageUrl = await uploadImage(imageUrl, 'categories');
    } else {
        uploadedImageUrl = imageUrl;
    }

    return await prisma.category.create({
        data: {
            name,
            slug,
            imageUrl: uploadedImageUrl,
        }
    })
}

// get all categories
export const getAllCategories = async() => {
    return await prisma.category.findMany({
        select :{
            id:true,
            name:true,
            slug:true ,
            imageUrl:true

        },
        orderBy:{
            name:'asc'
        }
    })
}

export const updateCategoryById = async (id: string, data: { name?: string; slug?: string; imageUrl?: string }) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
       throw new ApiError(
  404,
  "NOT_FOUND",
  "Category not found"
);
    }

    if (data.slug) {
        const existingSlug = await prisma.category.findUnique({ where: { slug: data.slug } });
        if (existingSlug && existingSlug.id !== id) {
            throw new ApiError(
  400,
  "BAD_REQUEST",
  "Slug already in use by another category"
);
        }
    }

    let uploadedImageUrl = data.imageUrl;
    if (data.imageUrl && data.imageUrl.startsWith('data:image/')) {
        uploadedImageUrl = await uploadImage(data.imageUrl, 'categories');
    }

    return await prisma.category.update({
        where: { id },
        data: {
            ...data,
            imageUrl: uploadedImageUrl,
        },
    });
}

export const deleteCategoryById = async (id: string) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
       throw new ApiError(
  404,
  "NOT_FOUND",
  "Category not found"
);
    }

    
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
        throw new ApiError(
  400,
  "BAD_REQUEST",
  "Cannot delete category because it has linked products"
);
    }

    return await prisma.category.delete({ where: { id } });
};