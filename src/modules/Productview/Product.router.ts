import { Router } from "express";
import { productViewController } from "./Product.controller"

; // logged in na hoyeo call korte pare

const router = Router();

// Public route — logged in na thakleo view track hobe (IP diye)
router.post("/products/:id/view",productViewController.trackView);

// View count dekhar route (seller/admin)
router.get("/products/:id/views", productViewController.getViewCount);

export default router;