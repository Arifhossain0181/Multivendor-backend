import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';


import authRouter from './modules/auth/auth.router';
import userRouter from './modules/user/user.router';
import sellerRouter from './modules/seller/seller.router';
import productRouter from './modules/product/product.router';
import categoryRouter from './modules/category/category.router';
import cartRouter from './modules/cart/cart.router';
import checkoutRouter from './modules/checkout/checkout.router';
import webhookRouter from './modules/webhook/webhook.router';
import orderRouter from './modules/order/order.router';
import fulfillmentRouter from './modules/fulfillment/fulfillment.router';
import reviewRouter from './modules/review/review.router';
import adminRouter from './modules/admin/admin.router';

const app = express();

// 1 STRIPE WEBHOOK ROUTE 
//
app.use('/api/webhooks', webhookRouter);

// global middlewares
app.use(cors());
app.use(express.json()); // json Parse body 


app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/sellers', sellerRouter);
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/orders', orderRouter);
app.use('/api/fulfillments', fulfillmentRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/admin', adminRouter);


app.use(errorHandler);

export default app;