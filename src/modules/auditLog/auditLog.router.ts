import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { getAuditLogs } from './auditLog.service.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;

    const filters: any = {};
    if (typeof req.query.action === 'string') filters.action = req.query.action;
    if (typeof req.query.entityType === 'string') filters.entityType = req.query.entityType;
    if (typeof req.query.entityId === 'string') filters.entityId = req.query.entityId;
    if (typeof req.query.adminId === 'string') filters.adminId = req.query.adminId;
    if (typeof req.query.startDate === 'string') filters.startDate = req.query.startDate;
    if (typeof req.query.endDate === 'string') filters.endDate = req.query.endDate;

    const logs = await getAuditLogs(filters, page, limit);
    return res.status(200).json(logs);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || 'Internal Server Error',
    });
  }
});

export default router;
