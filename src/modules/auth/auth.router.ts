import { Router } from 'express';
import { 
    login, 
    register, 
    refresh, 
    getMe, 
    updateProfile,
    logout
} from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { rateLimit } from '../../middleware/rateLimit';

const authRouter = Router();

// 
// PUBLIC ROUTES 

// 
authRouter.post('/register', rateLimit(60000, 10), register);

// 
authRouter.post('/login', rateLimit(60000, 10), login);

// 
authRouter.post('/refresh-token', refresh);

authRouter.post('/logout', authenticate, logout);

// PROTECTED ROUTES


authRouter.get('/me', authenticate, getMe);

authRouter.patch('/update-profile', authenticate, updateProfile);

export default authRouter;
