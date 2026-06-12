import { Request, Response, NextFunction } from 'express';

type Role = "USER" | "ADMIN" | "SELLER";

export const authorize = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        // Check if user is authenticated and has one of the required roles
        if (!user || !roles.includes(user.role as Role)) {
            return res.status(403).json({ 
                error: 'Forbidden: You do not have permission to perform this action.' 
            });
        }

        next();
    };
};