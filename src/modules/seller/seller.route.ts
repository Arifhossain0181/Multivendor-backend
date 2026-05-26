import { Router } from 'express';
import { applyAsSeller, getProfile, updateSubOrderStatus } from './seller.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { applySellerSchema, updateSubOrderStatusSchema } from './seller.schema';

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

export default router;