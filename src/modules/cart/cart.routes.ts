import { Router } from 'express';
import { getCart, addItemToCart, removeItemFromCart, emptyCart ,  updateCartItem} from './cart.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validation';
import { addCartItemSchema, removeCartItemSchema, updateItemQuantitySchema } from './cart.schema';

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
router.put(
  "/items/:id",
  validate(updateItemQuantitySchema),
  updateCartItem
);
// DELETE /api/cart 
router.delete('/', emptyCart);

export default router;