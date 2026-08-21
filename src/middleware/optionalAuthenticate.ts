import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        if (req.headers.cookie) {
            token = req.headers.cookie
                .split(';')
                .map(part => part.trim())
                .find(part => part.startsWith('accessToken='))
                ?.split('=')[1];
        }

        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string; role: string };
        (req as any).user = {
            id: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch {
        next();
    }
};
