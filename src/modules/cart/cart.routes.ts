import { Router } from 'express';
import { getCart, addItemToCart, removeItemFromCart, emptyCart } from './cart.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validation';
import { addCartItemSchema, removeCartItemSchema } from './cart.schema';

const router = Router();

// 
router.use(authenticate);

// GET /api/cart - 
router.get('/', getCart);

// POST /api/cart - 
router.post('/', validate(addCartItemSchema), addItemToCart);

// POST /api/cart/items - 
router.post('/items', validate(addCartItemSchema), addItemToCart);

// DELETE /api/cart/items/:id -
router.delete('/items/:id', validate(removeCartItemSchema), removeItemFromCart);

// DELETE /api/cart 
router.delete('/', emptyCart);

export default router;