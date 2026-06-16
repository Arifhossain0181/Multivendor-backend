import { Router } from 'express';
import { 
    login, 
    register, 
    refresh, 
    getMe, 
    updateProfile 
} from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// 
// PUBLIC ROUTES 

// 
router.post('/register', register);

// 
router.post('/login', login);

// 
router.post('/refresh-token', refresh);

// PROTECTED ROUTES


router.get('/me', authenticate, getMe);

router.patch('/update-profile', authenticate, updateProfile);

export default router;
