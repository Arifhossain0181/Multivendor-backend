import { ApiError } from "../../utlits/ApiError.js";
import { prisma } from "../../prisma/client.js";
import { PrismaClient } from "../../generated/prisma/client.js";

const DEDUPE_WINDOW_HOURS = 24; // ekei viewer 24 ghonta por abar count hobe

interface TrackViewInput {
  productId: string;
  viewerKey: string; // userId (logged in) othoba IP address
}

export const productViewService = {
  //  View track kora — dedupe logic soho
  trackView: async ({ productId , viewerKey }: TrackViewInput) => {
    const existing = await prisma.productView.findUnique({
      where: {
        productId_viewerKey: {
          productId : productId as string,
          viewerKey,
        },
      },
    });

    const now = new Date();

    // Ager view thakle, koto ghonta age hoyeche check kori
    if (existing) {
      const hoursSinceLastView =
        (now.getTime() - existing.viewedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastView < DEDUPE_WINDOW_HOURS) {
        // Same viewer, dedupe window er moddhe — count barbe na
        return { counted: false };
      }

      // Window pass hoye geche — record update kori, count barai
      await prisma.$transaction([
        prisma.productView.update({
          where: { id: existing.id },
          data: { viewedAt: now },
        }),
        prisma.product.update({
          where: { id: productId },
          data: { viewCount: { increment: 1 } },
        }),
      ]);

      return { counted: true };
    }

    // Notun viewer — notun record banao, count barao
    await prisma.$transaction([
      prisma.productView.create({
        data: { productId, viewerKey, viewedAt: now },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { viewCount: { increment: 1 } },
      }),
    ]);

    return { counted: true };
  },

  // Admin/seller dashboard e total view count dekhanor jonno
  getViewCount: async (productId: string) => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { viewCount: true },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    return product.viewCount;
  },
};
