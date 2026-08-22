import { Request, Response } from "express";
import { getPageContent, upsertPageContent } from "./pageContent.service";

export const getPublicPageContent = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const content = await getPageContent(key);
    return res.status(200).json({ success: true, data: content });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const updatePageContent = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { content } = req.body;

    if (typeof content !== "string") {
      return res.status(400).json({
        success: false,
        error: "Content must be a string",
      });
    }

    const updated = await upsertPageContent(key, content);
    return res.status(200).json({
      success: true,
      message: "Page content updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
