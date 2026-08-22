import { Router } from 'express';
import { updatePageContent } from './pageContent.controller';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.put('/:key', updatePageContent);

export default router;
