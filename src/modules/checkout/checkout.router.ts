import { Router } from 'express';
import { initiateCheckout } from './checkout.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validation';
import { initiateCheckoutSchema } from './checkout.schema';
import {

  verifyCheckoutSuccess,
} from "./checkout.controller";
const router = Router();

router.post(
    '/',
    authenticate,
    validate(initiateCheckoutSchema),
    initiateCheckout
);
router.get(
  "/success",
  authenticate,
  verifyCheckoutSuccess
);
export default router;