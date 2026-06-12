import { Request, Response } from 'express';

import { sendSuccess } from '../../utils/response';
import * as userService from './user.service';

/**
 * GET /me - Fetch profile of currently authenticated user
 */
export const getMe = (async (req: Request, res: Response) => {
    
    const userId = (req as any).user.id;
    const user = await userService.findById(userId);

    return sendSuccess(res, 200, 'User profile retrieved successfully', { user });
});

/**
 * PATCH /me - Update authenticated user profile details
 */
export const updateMe = (async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { name, email } = req.body;

    const updatedUser = await userService.updateProfile(userId, { name, email });

    return sendSuccess(res, 200, 'User profile updated successfully', { user: updatedUser });
});