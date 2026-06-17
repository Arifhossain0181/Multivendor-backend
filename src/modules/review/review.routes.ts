import { Router } from 'express';
import { createReview } from './review.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validation.js';
import { createReviewSchema } from './review.schema';

const router = Router();
router.post('/', authenticate, validate(createReviewSchema), createReview);
export default router;