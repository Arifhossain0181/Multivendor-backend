import { Router } from "express";
import { productViewController } from "./Product.controller"
import { rateLimit } from "../../middleware/rateLimit";
import { optionalAuthenticate } from "../../middleware/optionalAuthenticate";

const router = Router();

// Optional auth — logged in hole userId diye track hobe, na hole IP diye
router.post("/products/:id/view", rateLimit(60000, 30), optionalAuthenticate, productViewController.trackView);

// View count dekhar route (seller/admin)
router.get("/products/:id/views", productViewController.getViewCount);

export default router;