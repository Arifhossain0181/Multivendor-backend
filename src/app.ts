
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import { env } from "./config/env";
import { redis } from "./config/redis";
import { errorHandler } from "./middlewares/errorHandler";
import { rawbody } from "./middlewares/rawBody";

// ── Module routers (uncomment as you build each module) ────────
// import { authRouter }        from "./modules/auth/auth.router";
// import { userRouter }        from "./modules/user/user.router";
// import { sellerRouter }      from "./modules/seller/seller.router";
// import { categoryRouter }    from "./modules/category/category.router";
// import { productRouter }     from "./modules/product/product.router";
// import { inventoryRouter }   from "./modules/inventory/inventory.router";
// import { cartRouter }        from "./modules/cart/cart.router";
// import { checkoutRouter }    from "./modules/checkout/checkout.router";
// import { orderRouter }       from "./modules/order/order.router";
// import { fulfillmentRouter } from "./modules/fulfillment/fulfillment.router";
// import { reviewRouter }      from "./modules/review/review.router";
// import { analyticsRouter }   from "./modules/analytics/analytics.router";
// import { webhookRouter }     from "./modules/webhook/webhook.router";
// import { adminRouter }       from "./modules/admin/admin.router";

export const createApp = (): Application => {
  const app = express();

  // ── 1. Security headers ──────────────────────────────────
  app.set("trust proxy", 1); // needed for rate-limit behind nginx/load balancer
  app.use(helmet());

  // ── 2. CORS ───────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // ── 3. Global rate limiter ────────────────────────────────
  // Applies to every route. Per-route limiters (e.g. auth, views)
  // are tighter and configured inside each router.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
      }),
      message: { success: false, code: "TOO_MANY_REQUESTS", message: "Too many requests" },
    })
  );

  // ── 4. Stripe webhook — MUST come before express.json() ──
  // Uses rawBody middleware so we can verify Stripe's signature.
  // app.use("/webhooks/stripe", rawBody, webhookRouter);

  // ── 5. Body parsers ───────────────────────────────────────
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // ── 6. Health check ───────────────────────────────────────
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Server is running",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ── 7. API routes ─────────────────────────────────────────
  // app.use("/api/v1/auth",        authRouter);
  // app.use("/api/v1/users",       userRouter);
  // app.use("/api/v1/sellers",     sellerRouter);
  // app.use("/api/v1/categories",  categoryRouter);
  // app.use("/api/v1/products",    productRouter);
  // app.use("/api/v1/inventory",   inventoryRouter);
  // app.use("/api/v1/cart",        cartRouter);
  // app.use("/api/v1/checkout",    checkoutRouter);
  // app.use("/api/v1/orders",      orderRouter);
  // app.use("/api/v1/fulfillment", fulfillmentRouter);
  // app.use("/api/v1/reviews",     reviewRouter);
  // app.use("/api/v1/analytics",   analyticsRouter);
  // app.use("/api/v1/admin",       adminRouter);

  // ── 8. 404 handler ────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      code: "NOT_FOUND",
      message: "Route not found",
    });
  });

  // ── 9. Global error handler — MUST be last ────────────────
  app.use(errorHandler);

  return app;
};