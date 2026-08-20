import { Router } from 'express';
import { getMyOrders, getMyOrderDetails, receiveOrder } from './order.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validation.js';
import { getOrderQuerySchema, getOrderParamsSchema, receiveOrderParamsSchema } from './order.schema';

const router = Router();

router.use(authenticate);

// GET /api/orders?page=1&limit=10 - 
router.get('/', validate(getOrderQuerySchema), getMyOrders);

// GET /api/orders/:id -
router.get('/:id', validate(getOrderParamsSchema), getMyOrderDetails);

// PATCH /api/orders/:id/receive - User marks order as received
router.patch('/:id/receive', validate(receiveOrderParamsSchema), receiveOrder);

export default router;