import { Router } from 'express';
import { 
    login, 
    register, 
    refresh, 
    getMe, 
    updateProfile 
} from './auth.controller';
import { protect } from '../../middlewares/auth.middleware'; // 

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


router.get('/me', protect, getMe);

router.patch('/update-profile', protect, updateProfile);

export default router;