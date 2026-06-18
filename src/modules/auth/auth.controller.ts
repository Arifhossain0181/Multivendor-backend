import { Request, Response } from 'express';
import {
    register as registerUser,
    login as loginUser,
    refreshToken as refreshAccessToken,
    getme,
    updateMe,
} from './auth.service.js';

// Helper function to extract cookie from headers
const getcookieValue = (cookieHeader: string | undefined, key: string): string | undefined => {
    if (!cookieHeader) return undefined;
    return cookieHeader
        .split(';')
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith(`${key}=`))
        ?.split('=')[1];
};

const getErrorStatus = (error: unknown, fallback = 400) => {
    return (error as any)?.statusCode ?? fallback;
};

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Unexpected error';
};

/**
 * Updated Helper to set all 3 Cookies
 * 
 */
const setAuthCookies = (res: Response, token: string, accessToken: string, refreshToken: string) => {
    const isProd = process.env.NODE_ENV === 'production';
    
    
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 Hours
    });

   
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 Minutes
    });

    
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    });
};


export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        const result = await registerUser(name, email, password);

        setAuthCookies(res, result.token, result.accessToken, result.refreshToken);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: result.user,
            },
        });
    } catch (error) {
        const status = getErrorStatus(error);
        const message = getErrorMessage(error);
        res.status(status).json({
            success: false,
            message,
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);

    
        setAuthCookies(res, result.token, result.accessToken, result.refreshToken);

        res.status(200).json({ message: "User logged in successfully", ...result });
    } catch (error) {
        res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const fromCookie = getcookieValue(req.headers.cookie, 'refreshToken');
        const refreshToken = fromCookie || req.body?.refreshToken;

        const result = await refreshAccessToken(refreshToken);

        const isProd = process.env.NODE_ENV === 'production';


        res.cookie('token', result.token, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
        });

        res.status(200).json({ message: 'Access token refreshed successfully', ...result });
    } catch (error) {
        res.status(getErrorStatus(error, 401)).json({ error: getErrorMessage(error) });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await getme(userId);
        res.status(200).json({ message: "User details fetched successfully", user: result });
    } catch (error) {
        res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const result = await updateMe(userId, {
            name: req.body?.name,
            email: req.body?.email,
        });
        res.status(200).json({ message: "Profile updated successfully", user: result });
    } catch (error) {
        res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
    }
};