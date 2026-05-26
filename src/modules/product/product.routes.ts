import { Router } from 'express';
import { createProduct } from './product.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { createProductSchema } from './product.schema';

const router = Router();

// POST /api/products
router.post(
    '/',
    authenticate,
    authorize('SELLER'),
    validate(createProductSchema),
    createProduct
);

export default router;