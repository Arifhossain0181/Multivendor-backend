import { Request, Response } from 'express';
import * as checkoutService from './checkout.service';

export const initiateCheckout = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { shippingAddress } = req.body;

        const result = await checkoutService.processCheckout(userId, shippingAddress);

        return res.status(200).json({
            success: true,
            message: 'Checkout session initiated successfully',
            data: result // 
        });
    } catch (error: any) {
        // 
        if (error.statusCode === 409) {
            try {
                const parsedError = JSON.parse(error.message);
                if (parsedError.message === 'INSUFFICIENT_STOCK') {
                    return res.status(409).json({
                        success: false,
                        error: 'INSUFFICIENT_STOCK',
                        shortages: parsedError.shortages
                    });
                }
            } catch (e) {
                // JSON
            }
        }

        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};
export const verifyCheckoutSuccess = async (
  req: Request,
  res: Response
) => {
  try {
    const sessionId = req.query.session_id as string;

    const result = await checkoutService.verifyCheckoutSuccess(sessionId);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: result.order,
      paymentStatus: result.paymentStatus,
      orderId: result.orderId,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};