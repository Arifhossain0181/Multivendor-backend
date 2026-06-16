import { Request, Response } from 'express';
import * as adminService from './admin.service';

export const updateSeller = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Seller Profile ID
        const { status } = req.body; // APPROVED or REJECTED

        if (typeof id !== 'string') {
            return res.status(400).json({ success: false, error: 'Invalid seller profile id' });
        }

        if (status !== 'APPROVED' && status !== 'REJECTED') {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const updated = await adminService.updateSellerStatus(id, status);
        return res.status(200).json({ success: true, message: `Seller status updated to ${status}`, data: updated });
    } catch (error: any) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, error: error.message || 'Internal Server Error' });
    }
}; 
