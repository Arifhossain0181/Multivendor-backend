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
    const id = typeof req.params.id === 'string' ? req.params.id : Array.isArray(req.params.id) ? req.params.id[0] : '';
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
    const id = typeof req.params.id === 'string' ? req.params.id : Array.isArray(req.params.id) ? req.params.id[0] : '';

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
    const returnId = typeof req.params.returnId === 'string' ? req.params.returnId : Array.isArray(req.params.returnId) ? req.params.returnId[0] : '';
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
    const disputeId = typeof req.params.disputeId === 'string' ? req.params.disputeId : Array.isArray(req.params.disputeId) ? req.params.disputeId[0] : '';
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
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await refundService.getAllReturns(cursor, limit);

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};

export const getAllDisputes = async (req: Request, res: Response) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await refundService.getAllDisputes(cursor, limit);

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
  }
};
