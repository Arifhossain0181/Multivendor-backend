import { Router } from 'express';
import { applyAsSeller, getProfile, updateSubOrderStatus, assignDeliveryMan } from './seller.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validation.js';
import { applySellerSchema, updateSubOrderStatusSchema, assignDeliveryManSchema } from './seller.schema';

const router = Router();


router.use(authenticate);


router.post('/apply', validate(applySellerSchema), applyAsSeller);


router.get('/profile', authorize('SELLER'), getProfile);


router.patch(
    '/sub-orders/:id/status', 
    authorize('SELLER'), 
    validate(updateSubOrderStatusSchema), 
    updateSubOrderStatus
);

router.patch(
    '/sub-orders/:id/assign-delivery',
    authorize('SELLER'),
    validate(assignDeliveryManSchema),
    assignDeliveryMan
);

export default router;