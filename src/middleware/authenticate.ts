import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        // ১. cookies theke accessToken ana
        if (req.headers.cookie) {
            const cookieParts = req.headers.cookie
                .split(';')
                .map(part => part.trim());
            
            const accessTokenPart = cookieParts.find(part => part.startsWith('accessToken='));
            const tokenPart = cookieParts.find(part => part.startsWith('token='));
            
            token = accessTokenPart?.split('=')[1] || tokenPart?.split('=')[1];
            
            console.log('Auth middleware - Cookies found:', cookieParts.length);
            console.log('Auth middleware - accessToken found:', !!accessTokenPart);
            console.log('Auth middleware - token found:', !!tokenPart);
            console.log('Auth middleware - using token:', !!token);
        }

        // ২. cookies na thakle Authorization header theke Bearer token ana
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        
        if (!token) {
            console.log('Auth middleware - No token found, returning 401');
            return res.status(401).json({ error: 'Authentication required. Please log in.' });
        }

        // ৩. token verify kora
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string; role: string };
        console.log('Auth middleware - Token verified for user:', decoded.userId, 'role:', decoded.role);

        // ৪. token thik thakle user info req object e attach kora
        (req as any).user = {
            id: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch (error) {
        console.error('Auth middleware - Token verification failed:', error);
        return res.status(401).json({ error: 'Invalid or expired access token.' });
    }
};