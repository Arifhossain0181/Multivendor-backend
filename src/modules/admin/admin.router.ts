import { Router } from 'express';
import {
  cancelOrder,
  deleteProduct,
  getOrders,
  getProducts,
  getStats,
  getUsers,
  updateProduct,
  updateSeller,
  getFulfillments,
  toggleUserActive,
} from './admin.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/seller-status', updateSeller);
router.patch('/users/:id/active', toggleUserActive);
router.get('/products', getProducts);
router.patch('/products/:id/status', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getOrders);
router.patch('/orders/:id/cancel', cancelOrder);
router.get('/fulfillments', getFulfillments);

export default router;
