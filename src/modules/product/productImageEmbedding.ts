export type ProductImageEmbedding = {
  id: string;
  productId: string;
  imageUrl: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
};
