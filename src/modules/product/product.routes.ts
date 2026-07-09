import { Router } from 'express';
import { createProduct, getProduct, listProducts, getMyProducts, updateProduct } from './product.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validation.js';


import { createProductSchema, updateProductSchema } from './product.schema';

const router = Router();

// GET /api/products/my-products
router.get('/my-products', authenticate, getMyProducts);

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

// PUT /api/products/:id
router.put(
    '/:id',
    authenticate,
    authorize('SELLER', 'ADMIN'),
    validate(updateProductSchema),
    updateProduct
);

export default router;
