import { Router } from 'express';
import { handleStripeWebhook } from './webhook.controller';
import { rawBody } from '../../middleware/rawbody'; //

const router = Router();

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Stripe Webhook Listener for asynchronous fulfillment
 * @access  Public (Secured via Stripe Signature Verification)
 */
router.post('/stripe', rawBody, handleStripeWebhook);

export default router;