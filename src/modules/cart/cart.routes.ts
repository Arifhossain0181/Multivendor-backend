import { Router } from 'express';
import { getCart, addItemToCart, removeItemFromCart, emptyCart } from './cart.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { addCartItemSchema, removeCartItemSchema } from './cart.schema';

const router = Router();

// 
router.use(authenticate);

// GET /api/cart - 
router.get('/', getCart);

// POST /api/cart/items - 
router.post('/items', validate(addCartItemSchema), addItemToCart);

// DELETE /api/cart/items/:id -
router.delete('/items/:id', validate(removeCartItemSchema), removeItemFromCart);

// DELETE /api/cart 
router.delete('/', emptyCart);

export default router;