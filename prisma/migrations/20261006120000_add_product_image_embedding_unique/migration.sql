-- Add unique constraint so product + image URL can be updated reliably during visual search embedding sync.
CREATE UNIQUE INDEX "product_image_embeddings_productId_imageUrl_key"
ON "product_image_embeddings"("productId", "imageUrl");
