import { Router } from 'express';
import { updateSeller } from './admin.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// PATCH /api/admin/sellers/:id/status
router.patch('/sellers/:id/status', updateSeller);

export default router;