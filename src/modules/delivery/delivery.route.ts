import { Router } from 'express';
import { registerDeliveryMan, getMyProfile, listDeliveryMen, listApprovedDeliveryMen, updateDeliveryManStatus, deleteDeliveryMan, getMyAssignments } from './delivery.controller';
import { validate } from '../../middleware/validation.js';
import { deliveryManSchema } from './delivery.schema';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.post('/register', validate(deliveryManSchema), registerDeliveryMan);

router.get('/me', authenticate, authorize('DELIVERY'), getMyProfile);

router.get('/my-assignments', authenticate, authorize('DELIVERY'), getMyAssignments);

router.get('/', authenticate, authorize('ADMIN'), listDeliveryMen);

router.get('/approved', authenticate, authorize('ADMIN', 'SELLER'), listApprovedDeliveryMen);

router.patch('/:id/status', authenticate, authorize('ADMIN'), updateDeliveryManStatus);

router.delete('/:id', authenticate, authorize('ADMIN'), deleteDeliveryMan);

export default router;
