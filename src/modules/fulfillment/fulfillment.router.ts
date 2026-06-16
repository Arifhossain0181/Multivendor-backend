import { Router } from 'express';
import { getMyFulfillments, updateFulfillmentStatus } from './fulfillment.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from "../../middleware/validation";
import { updateFulfillmentSchema } from './fulfillment.schema';

const router = Router();

router.use(authenticate, authorize('SELLER'));

// GET /api/fulfillments -
router.get('/', getMyFulfillments);

// PATCH /api/fulfillments/:id/status - 
router.patch('/:id/status', validate(updateFulfillmentSchema), updateFulfillmentStatus);

export default router;