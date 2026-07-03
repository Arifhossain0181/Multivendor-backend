import { Router } from 'express';
import { createProduct, getProduct, listProducts } from './product.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validation.js';


import { createProductSchema } from './product.schema';

const router = Router();

// GET /api/products?page=1&pageSize=12
router.get('/', listProducts);

// GET /api/products/:id
router.get('/:id', getProduct);

// POST /api/products
router.post(
    '/',
    authenticate,
    authorize('SELLER', 'ADMIN'),
    validate(createProductSchema),
    createProduct
);

export default router;