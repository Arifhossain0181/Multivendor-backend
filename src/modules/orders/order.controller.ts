import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import * as orderService from './order.service';
export const getMyOrders =async(req:Request, res:Response) => {
    try{
        const userId = (req as any).use.id ;
        //zod validation thke validate data Pagination
        const page = (req as any).query.page as number;
        const limit = (req as any).query.limit as number;
        const result = await orderService.getCustomerOrders(userId,page,limit);
        return res.status(200).json({ success: true, data: result });
    }catch(error:any){
        console.error(`[Get Orders Error]`, error.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }}
    // ২. Get Single Order Detail
export const getMyOrderDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const masterOrderId = req.params.id;

        const order = await orderService.getOrderDetails(userId, masterOrderId as string);

        return res.status(200).json({
            success: true,
            message: 'Order details retrieved successfully',
            data: order
        });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};