import { Router } from 'express';
import { getMe, updateMe } from './user.controller';


import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';


import { updateMeSchema } from './user.schema';

const router = Router();


router.use(authenticate);




router.get('/me', getMe);


router.patch('/me', validate(updateMeSchema), updateMe);

export default router;