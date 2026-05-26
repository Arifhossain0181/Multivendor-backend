import { Router } from 'express';
import { getVariantStock, updateVariantStock } from './inventory.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { updateStockSchema } from './inventory.schema';

const router = Router();

// এই মডিউলের সব রাউটের জন্য লগইন চেক মাস্ট
router.use(authenticate);

// ১. সেলার বা কাস্টমার যেকোনো ভ্যারিয়েন্টের স্টক দেখতে পারবে
// GET /api/products/:id/variants/:vid/stock
router.get('/:id/variants/:vid/stock', getVariantStock);

// PATCH /api/products/:id/variants/:vid/stock
router.patch(
    '/:id/variants/:vid/stock',
    authorize('SELLER'),
    validate(updateStockSchema),
    updateVariantStock
);

export default router;