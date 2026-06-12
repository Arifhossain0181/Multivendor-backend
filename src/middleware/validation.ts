import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError, } from 'zod';

export const validate = (schema: ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Body, Query, and Params validation using Zod schema
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod validation errors to a more readable structure
                const formattedErrors = error.issues.map((err) => ({
                    field: err.path.join('.').replace(/^(body|query|params)\./, ''),
                    message: err.message,
                }));
                
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: formattedErrors 
                });
            }
            next(error);
        }
    };
};