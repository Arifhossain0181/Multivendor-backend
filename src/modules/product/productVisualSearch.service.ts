import { prisma } from "../../prisma/client.js";
import { generateImageEmbedding, cosineSimilarity } from "./clip.service.js";

// ---------- প্রোডাক্টের ছবির embedding সেভ ----------
export const embedProductImages = async (
  productId: string,
  imageUrls: string[]
): Promise<void> => {
  for (const imageUrl of imageUrls) {
    try {
      const embedding = await generateImageEmbedding(imageUrl);

      const existing = await prisma.productImageEmbedding.findFirst({
        where: { productId, imageUrl },
        select: { id: true },
      });

      if (existing) {
        await prisma.productImageEmbedding.update({
          where: { id: existing.id },
          data: { embedding },
        });
      } else {
        await prisma.productImageEmbedding.create({
          data: { productId, imageUrl, embedding },
        });
      }
    } catch (error: any) {
      console.error(`Embed failed (${productId}, ${imageUrl}):`, error.message);
    }
  }
};

// ---------- ছবি দিয়ে সার্চ ----------
const ensureActiveProductEmbeddings = async (): Promise<void> => {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, imageUrls: true },
  });

  for (const product of products) {
    if (!product.imageUrls?.length) continue;
    await embedProductImages(product.id, product.imageUrls);
  }
};

export const searchProductsByImage = async (
  buffer: Buffer,
  mime: string,
  limit = 20,
  minScore = 0.55
): Promise<{ product: any; similarity: number }[]> => {
  const queryEmbedding = await generateImageEmbedding(buffer, mime);

  let rows = await prisma.productImageEmbedding.findMany({
    where: { product: { status: "ACTIVE" } },
    select: { productId: true, embedding: true },
  });

  if (!rows.length) {
    await ensureActiveProductEmbeddings();
    rows = await prisma.productImageEmbedding.findMany({
      where: { product: { status: "ACTIVE" } },
      select: { productId: true, embedding: true },
    });
  }

  const best = new Map<string, number>();
  for (const row of rows) {
    const candidate = row.embedding as number[] | number[] | null;
    if (!Array.isArray(candidate) || !candidate.length) continue;

    try {
      const score = cosineSimilarity(queryEmbedding, candidate);
      if (score > (best.get(row.productId) ?? -1)) {
        best.set(row.productId, score);
      }
    } catch {
      continue;
    }
  }

  const thresholds = [minScore, 0.5, 0.45];

  const top = [...best.entries()]
    .filter(([, score]) => score >= thresholds[0])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (!top.length) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: top.map(([id]) => id) } },
    include: {
      variants: true,
      inventory: true,
      reviews: { select: { rating: true } },
      _count: { select: { views: true, reviews: true } },
    },
  });

  const byId = new Map(products.map((p: any) => [p.id, p]));

  return top
    .map(([id, similarity]) => {
      const product = byId.get(id);
      if (!product) return null;

      const imageUrl = Array.isArray(product.imageUrls) && product.imageUrls.length
        ? product.imageUrls[0]
        : "/globe.svg";

      return {
        product: {
          ...product,
          imageUrl,
          imageUrls: product.imageUrls ?? [],
        },
        similarity,
      };
    })
    .filter((r): r is { product: any; similarity: number } => Boolean(r))
    .slice(0, limit);
};