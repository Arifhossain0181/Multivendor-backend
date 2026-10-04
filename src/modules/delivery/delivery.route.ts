import { Router } from 'express';
import { registerDeliveryMan, getMyProfile, listDeliveryMen, updateDeliveryManStatus } from './delivery.controller';
import { validate } from '../../middleware/validation.js';
import { deliveryManSchema } from './delivery.schema';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.post('/register', validate(deliveryManSchema), registerDeliveryMan);

router.get('/me', authenticate, authorize('DELIVERY'), getMyProfile);

router.get('/', authenticate, authorize('ADMIN'), listDeliveryMen);

router.patch('/:id/status', authenticate, authorize('ADMIN'), updateDeliveryManStatus);

export default router;
