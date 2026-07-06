import { Router } from 'express';
import {
  deleteProduct,
  getOrders,
  getProducts,
  getStats,
  getUsers,
  updateProduct,
  updateSeller,
} from './admin.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/seller-status', updateSeller);
router.get('/products', getProducts);
router.patch('/products/:id/status', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getOrders);

export default router;
