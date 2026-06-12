import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    err: any, 
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    // Determine the status code and message to send in the response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log the error details for debugging (can be enhanced to use a logging library)
    console.error(`[Error] ${req.method} ${req.url} :`, err);

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        // Include stack trace in development mode for easier debugging
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};