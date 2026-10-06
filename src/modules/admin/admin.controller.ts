import { Request, Response } from 'express';
import * as adminService from './admin.service';
import { assignDeliveryManSchema } from '../delivery/delivery.schema.js';
import { validate } from '../../middleware/validation.js';

const parseLimit = (value: unknown, fallback = 10) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 50) : fallback;
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
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = parseLimit(req.query.limit, 10);
    const hasPaidOrders = req.query.hasPaidOrders === 'true';
    const users = await adminService.listUsers(role, cursor, limit, { hasPaidOrders });
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
    const adminId = (req as any).user?.id;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({ error: 'Invalid seller profile id' });
    }

    if (!['APPROVED', 'REJECTED', 'PENDING', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await adminService.updateSellerStatus(id, status, {
      adminId,
      action: status === 'APPROVED' ? 'APPROVE_SELLER' : status === 'REJECTED' ? 'REJECT_SELLER' : 'UPDATE_SELLER_STATUS',
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const toggleUserActive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminId = (req as any).user?.id;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const updated = await adminService.toggleUserActive(id, isActive, {
      adminId,
      action: isActive ? 'UNBLOCK_USER' : 'BLOCK_USER',
    });
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
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = parseLimit(req.query.limit, 10);
    const products = await adminService.listProducts(userId, status, cursor, limit, true);
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
    const adminId = (req as any).user?.id;

    if (typeof id !== 'string' || !id) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    if (!['ACTIVE', 'BLOCKED', 'DRAFT'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await adminService.updateProductStatus(id, status, {
      adminId,
      action: status === 'BLOCKED' ? 'BLOCK_PRODUCT' : 'UNBLOCK_PRODUCT',
    });
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
    const adminId = (req as any).user?.id;

    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const result = await adminService.deleteProduct(id, {
      adminId,
      action: 'DELETE_PRODUCT',
    });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error",
    });
  }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = parseLimit(req.query.limit, 10);
        const orders = await adminService.listOrders(cursor, limit);
        return res.status(200).json(orders);
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || 'Internal Server Error',
        });
    }
};

export const getFulfillments = async (req: Request, res: Response) => {
    try {
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = parseLimit(req.query.limit, 10);
        const result = await adminService.listFulfillments(cursor, limit);
        return res.status(200).json(result);
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || 'Internal Server Error',
        });
    }
};

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = (req as any).user?.id;
        const result = await adminService.cancelOrder(id as string, {
          adminId,
          action: 'CANCEL_ORDER',
        });
        return res.status(200).json(result);
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || 'Internal Server Error',
        });
    }
};

export const assignDeliveryMan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { deliveryManId } = req.body;
        const adminId = (req as any).user?.id;

        if (typeof id !== 'string' || !id) {
            return res.status(400).json({ error: 'Invalid sub-order id' });
        }

        if (typeof deliveryManId !== 'string' || !deliveryManId) {
            return res.status(400).json({ error: 'Invalid delivery man id' });
        }

        const result = await adminService.assignDeliveryMan(id, deliveryManId, {
          adminId,
          action: 'ASSIGN_DELIVERY_MAN',
        });
        return res.status(200).json(result);
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || 'Internal Server Error',
        });
    }
};
