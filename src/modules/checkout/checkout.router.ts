import { Router } from 'express';
import { initiateCheckout } from './checkout.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validation';
import { initiateCheckoutSchema } from './checkout.schema';

const router = Router();

router.post(
    '/',
    authenticate,
    validate(initiateCheckoutSchema),
    initiateCheckout
);

export default router;