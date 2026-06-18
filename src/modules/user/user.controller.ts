import { Request, Response } from "express";
import { sendSuccess } from "../../utlits/resPonse";
import * as userService from "./user.service";
// removed unused imports

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await userService.findById(userId);

    return sendSuccess(res, { user }, 200, "User profile retrieved successfully");
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, email } = req.body;

    const updatedUser = await userService.updateProfile(userId, {
      name,
      email,
    });

    return sendSuccess(res, { user: updatedUser }, 200, "User profile updated successfully");
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
