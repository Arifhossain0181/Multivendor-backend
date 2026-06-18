import { Router } from 'express';
import { getMe, updateMe } from './user.controller';


import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validation';


import { updateMeSchema } from './user.schema';

const router = Router();


router.use(authenticate);




router.get('/me', getMe);


router.patch('/me', validate(updateMeSchema), updateMe);

export default router;