import { Request, Response } from "express";
import { productViewService } from "./PRoduct.service";
import { string } from "zod";
// Viewer identify kora — logged in hole userId, na hole IP
function getViewerKey(req: Request): string {
  const userId = (req as any).user?.id; // auth middleware theke ashe
  if (userId) return `user:${userId}`;

  // IP na paile fallback
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  return `ip:${ip}`;
}

export const productViewController = {
  // POST /products/:id/view
  trackView: async (req: Request, res: Response) => {
    try {
      const { id: productId } = req.params;
      const viewerKey = getViewerKey(req);

      const result = await productViewService.trackView( { productId : productId as string, viewerKey });

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to track product view" });
    }
  },

  // GET /products/:id/views  (admin/seller dashboard er jonno)
  getViewCount: async (req: Request, res: Response) => {
    try {
      const { id: productId } = req.params;
      const viewCount = await productViewService.getViewCount(productId as string);

      res.status(200).json({ viewCount });
    } catch (error) {
      res.status(404).json({ message: "Product not found" });
    }
  },
};