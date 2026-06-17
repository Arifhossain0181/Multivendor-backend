import { Router } from 'express';
import { createProduct } from './product.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validation.js';


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