import { Request, Response } from "express";
import { sendSuccess } from "../../utlits/resPonse";
import * as userService from "./user.service";
import { number, string } from "zod";

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await userService.findById(userId);

    return sendSuccess(res, 200, "User profile retrieved successfully", {
      user,
    });
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

    return sendSuccess(res, 200, "User profile updated successfully", {
      user: updatedUser,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
