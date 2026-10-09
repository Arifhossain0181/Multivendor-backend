import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validation.js';
import {
  createReturnRequest,
  resolveReturn,
  adminResolveReturn,
  processRefund,
  createDispute,
  resolveDispute,
  getMyReturns,
  getSellerReturns,
  getAllReturns,
  getAllDisputes,
} from './refund.controller.js';
import {
  createReturnSchema,
  resolveReturnSchema,
  createDisputeSchema,
  processRefundSchema,
} from './refund.schema.js';
import { authorize as authorizeRole } from '../../middleware/authorize.js';

const router = Router();

router.post('/returns', authenticate, validate(createReturnSchema), createReturnRequest);

router.get('/my/returns', authenticate, getMyReturns);

router.patch('/returns/:id/resolve', authenticate, authorizeRole('SELLER'), validate(resolveReturnSchema), resolveReturn);

router.patch('/admin/returns/:id/resolve', authenticate, authorizeRole('ADMIN'), validate(resolveReturnSchema), adminResolveReturn);

router.patch('/returns/:id/refund', authenticate, authorizeRole('ADMIN'), validate(processRefundSchema), processRefund);

router.post('/disputes/:returnId', authenticate, createDispute);

router.patch('/disputes/:disputeId/resolve', authenticate, authorizeRole('ADMIN'), validate(createDisputeSchema), resolveDispute);

router.get('/seller/returns', authenticate, authorizeRole('SELLER'), getSellerReturns);

router.get('/admin/returns', authenticate, authorizeRole('ADMIN'), getAllReturns);

router.get('/admin/disputes', authenticate, authorizeRole('ADMIN'), getAllDisputes);

export default router;
