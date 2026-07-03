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

const authRouter = Router();

// 
// PUBLIC ROUTES 

// 
authRouter.post('/register', register);

// 
authRouter.post('/login', login);

// 
authRouter.post('/refresh-token', refresh);

authRouter.post('/logout', logout);

// PROTECTED ROUTES


authRouter.get('/me', authenticate, getMe);

authRouter.patch('/update-profile', authenticate, updateProfile);

export default authRouter;
