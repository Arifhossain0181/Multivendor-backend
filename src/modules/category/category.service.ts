
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utlits/ApiError.js';
export const createCategory = async(name: string, slug: string) => {
    const existingCategory = await prisma.category.findUnique({
        where: { slug },
    })
    if (existingCategory) {
        throw new Error('Category with this slug already exists');
    }
    return await prisma.category.create({
        data: {
            name,slug
        }
    })
}

// get all categories
export const getAllCategories = async() => {
    return await prisma.category.findMany({
        select :{
            id:true,
            name:true,
            slug:true

        },
        orderBy:{
            name:'asc'
        }
    })
}

export const updateCategoryById = async (id: string, data: { name?: string; slug?: string }) => {
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

    return await prisma.category.update({
        where: { id },
        data,
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