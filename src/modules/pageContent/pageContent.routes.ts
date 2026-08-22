import { Router } from 'express';
import { getPublicPageContent, updatePageContent } from './pageContent.controller';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Public: GET /api/page-content/:key
router.get('/:key', getPublicPageContent);

export default router;
