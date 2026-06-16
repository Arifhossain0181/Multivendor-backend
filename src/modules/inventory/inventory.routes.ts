import { Router } from 'express';
import { getVariantStock, updateVariantStock } from './inventory.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validation.js';
import { updateStockSchema } from './inventory.schema';

const router = Router();

// 
router.use(authenticate);

// ১. 
// 
router.get('/:id/variants/:vid/stock', getVariantStock);

// PATCH /api/products/:id/variants/:vid/stock
router.patch(
    '/:id/variants/:vid/stock',
    authorize('SELLER'),
    validate(updateStockSchema),
    updateVariantStock
);

export default router;