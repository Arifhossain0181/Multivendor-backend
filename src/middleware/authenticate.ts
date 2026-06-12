import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        // ১. cookies theke accessToken ana
        if (req.headers.cookie) {
            token = req.headers.cookie
                .split(';')
                .map(part => part.trim())
                .find(part => part.startsWith('accessToken='))
                ?.split('=')[1];
        }

        // ২. cookies na thakle Authorization header theke Bearer token ana
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required. Please log in.' });
        }

        // ৩. token verify kora
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string; role: string };

        // ৪. token thik thakle user info req object e attach kora
        (req as any).user = {
            id: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired access token.' });
    }
};