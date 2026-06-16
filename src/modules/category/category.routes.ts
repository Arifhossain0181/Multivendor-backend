import { Router } from 'express';
import { create, list, update, remove } from './category.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validation.js';
import { createCategorySchema, updateCategorySchema } from './category.scheama.js';

const router = Router();


//
router.get('/', list);

// 
// PROTECTED ROUTES (ADMIN ONLY)

router.use(authenticate, authorize('ADMIN'));

router.post('/', validate(createCategorySchema), create);


router.patch('/:id', validate(updateCategorySchema), update);

router.delete('/:id', remove);

export default router;
