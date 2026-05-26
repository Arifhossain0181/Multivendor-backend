import { Router } from 'express';
import { create, list, update, remove } from './category.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from './category.schema';

const router = Router();


//
router.get('/', list);

// 
// PROTECTED ROUTES (ADMIN ONLY)

router.use(authenticate, authorize('ADMIN'));

router.post('/', validate(createCategorySchema), create);


router.patch('/:id', validate(updateCategorySchema), update);

/
router.delete('/:id', remove);

export default router;