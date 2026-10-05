import { Router } from 'express';
import { createReview, replyReview, getProductReviews, getSellerReviews, getMyReviews } from './review.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validation.js';
import { createReviewSchema, replyReviewSchema } from './review.schema';

const router = Router();

router.post('/', authenticate, validate(createReviewSchema), createReview);

router.get('/my', authenticate, getMyReviews);

router.get('/product/:productId', getProductReviews);

router.get('/seller/:sellerId', getSellerReviews);

router.patch('/:id/reply', authenticate, authorize('SELLER'), validate(replyReviewSchema), replyReview);

export default router;