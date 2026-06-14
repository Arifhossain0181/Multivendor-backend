import { Router } from 'express';
import { initiateCheckout } from './checkout.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { initiateCheckoutSchema } from './checkout.schema';

const router = Router();

router.post(
    '/',
    authenticate,
    validate(initiateCheckoutSchema),
    initiateCheckout
);

export default router;