import { Router } from 'express';
import { getMyOrders, getMyOrderDetails } from './order.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { getOrderQuerySchema, getOrderParamsSchema } from './order.schema';
import { validate } from '../../middleware/validation.js';
const router = Router();

router.use(authenticate);

// GET /api/orders?page=1&limit=10 - 
router.get('/', validate(getOrderQuerySchema), getMyOrders);

// GET /api/orders/:id -
router.get('/:id', validate(getOrderParamsSchema), getMyOrderDetails);

export default router;