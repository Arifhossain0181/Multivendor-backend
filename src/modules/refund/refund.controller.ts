import { Request, Response } from 'express';
import * as refundService from './refund.service.js';

export const createReturnRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { subOrderId, reason, requestedQty } = req.body;

    const returnRequest = await refundService.createReturnRequest(userId, subOrderId, reason, requestedQty);

    return res.status(201).json({ success: true, message: 'Return request submitted successfully', data: returnRequest });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const resolveReturn = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { action, note } = req.body;

    const result = await refundService.resolveReturnRequest(userId, id, action, note);

    return res.status(200).json({ success: true, message: `Return request ${action}ed successfully`, data: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const processRefund = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const { id } = req.params;

    const result = await refundService.processRefund(adminId, id);

    return res.status(200).json({ success: true, message: 'Refund processed successfully', data: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const createDispute = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { returnId } = req.params;
    const { resolution } = req.body;

    const dispute = await refundService.createDispute(userId, returnId, resolution);

    return res.status(201).json({ success: true, message: 'Dispute created successfully', data: dispute });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const resolveDispute = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const { disputeId } = req.params;
    const { resolution } = req.body;

    const dispute = await refundService.resolveDispute(adminId, disputeId, resolution);

    return res.status(200).json({ success: true, message: 'Dispute resolved successfully', data: dispute });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const getMyReturns = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const returns = await refundService.getMyReturns(userId);

    return res.status(200).json({ success: true, data: returns });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const getSellerReturns = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.id;
    const returns = await refundService.getSellerReturns(sellerId);

    return res.status(200).json({ success: true, data: returns });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const getAllReturns = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await refundService.getAllReturns(page, limit);

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const getAllDisputes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await refundService.getAllDisputes(page, limit);

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};
