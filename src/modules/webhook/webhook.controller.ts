import { Request, Response } from 'express';
import { stripe } from '../../config/stripe';
import * as webhookService from './webhook.service';

export const handleStripeWebhook = async (req: Request, res: Response) => {
    //
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
        return res.status(400).json({ success: false, error: 'Missing stripe-signature header' });
    }

    let event;

    try {
        // 
        event = stripe.webhooks.constructEvent(
            (req as any).rawBody, 
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`[Webhook Sign Error]`, err.message);
        return res.status(400).send(`Webhook Signature Verification Failed: ${err.message}`);
    }

    // 
    try {
        // checkout.session.completed 
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any;
            
            // 
            const masterOrderId = session.metadata.masterOrderId;

            if (masterOrderId) {
                // 
                await webhookService.handleSuccessfulPayment(masterOrderId, event.id);
            }
        }

        // 
        return res.status(200).json({ received: true });
    } catch (error: any) {
        console.error(`[Webhook Process Error]`, error.message);
        // 
        return res.status(500).json({ success: false, error: 'Internal Webhook Handler Error' });
    }
};