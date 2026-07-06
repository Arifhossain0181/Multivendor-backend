import { Request, Response } from 'express';
import * as adminService from './admin.service';

const parsePage = (value: unknown, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const parseLimit = (value: unknown, fallback = 10) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 10);
    const users = await adminService.listUsers(role, page, limit);
    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const updateSeller = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({ error: 'Invalid seller profile id' });
    }

    if (!['APPROVED', 'REJECTED', 'PENDING', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await adminService.updateSellerStatus(id, status);
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 10);
    const products = await adminService.listProducts(userId, status, page, limit);
    return res.status(200).json(products);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    if (!['ACTIVE', 'BLOCKED', 'DRAFT'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await adminService.updateProductStatus(id, status);
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const result = await adminService.deleteProduct(id);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error",
    });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 10);
    const orders = await adminService.listOrders(page, limit);
    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};
