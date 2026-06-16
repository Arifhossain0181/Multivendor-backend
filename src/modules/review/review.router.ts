import { Router } from 'express';
import { createReview } from './review.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { createReviewSchema } from './review.schema';

const router = Router();
router.post('/', authenticate, validate(createReviewSchema), createReview);
export default router;