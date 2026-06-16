import { Request, Response } from 'express';
import * as categoryService from './category.service';

// ১. Create Category (Admin Only)
export const create = async (req: Request, res: Response) => {
    try {
        const { name, slug } = req.body;
        const category = await categoryService.createCategory(name, slug);

        return res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

// ২. List Categories (Public)
export const list = async (req: Request, res: Response) => {
    try {
        const categories = await categoryService.getAllCategories();

        return res.status(200).json({
            success: true,
            message: 'Categories fetched successfully',
            data: categories,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

// ৩. Update Category (Admin Only)
export const update = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, slug } = req.body;

        const updatedCategory = await categoryService.updateCategoryById(id as string, { name, slug });

        return res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: updatedCategory,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

// ४. Delete Category (Admin Only)
export const remove = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await categoryService.deleteCategoryById(id as string);

        return res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};