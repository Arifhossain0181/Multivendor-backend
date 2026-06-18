import Stripe from 'stripe';



const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
   
    throw new Error('CRITICAL: STRIPE_SECRET_KEY is missing in environmental variables!');
}

export const stripe = new Stripe(stripeSecretKey, {apiVersion: '2026-6-18' as any,
    typescript: true,
    appInfo: {
        name: 'MultiVendor-Marketplace-Backend',
        version: '1.0.0',
    },
    maxNetworkRetries: 3,
    timeout: 10000,
    });