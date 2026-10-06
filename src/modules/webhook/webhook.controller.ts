import { Request, Response } from 'express';

import * as webhookService from './webhook.service';
import { stripe } from '../../config/stripe';

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        return res.status(400).json({ success: false, error: 'Missing stripe-signature header' });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            (req as any).rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`[Webhook Sign Error]`, err.message);
        return res.status(400).send(`Webhook Signature Verification Failed: ${err.message}`);
    }

    try {
        const stripeEvent = await webhookService.recordEvent(event);

        if (stripeEvent.status === 'PROCESSED') {
            return res.status(200).json({ received: true });
        }

        if (stripeEvent.status === 'FAILED' && stripeEvent.retryCount >= stripeEvent.maxRetries) {
            return res.status(200).json({ received: true });
        }

        if (stripeEvent.type === 'checkout.session.completed') {
            await webhookService.processStripeEvent(event);
        }

        await webhookService.markProcessed(event.id);

        return res.status(200).json({ received: true });
    } catch (error: any) {
        console.error(`[Webhook Process Error]`, error.message);

        if (event?.id) {
            await webhookService.markFailed(event.id, error.message);
        }

        return res.status(500).json({ success: false, error: 'Internal Webhook Handler Error' });
    }
};
