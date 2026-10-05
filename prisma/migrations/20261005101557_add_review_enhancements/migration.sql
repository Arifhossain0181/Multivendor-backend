-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "sellerId" TEXT,
ADD COLUMN     "sellerRating" INTEGER,
ADD COLUMN     "sellerReply" TEXT,
ADD COLUMN     "sellerReplyAt" TIMESTAMP(3),
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "reviews_sellerId_idx" ON "reviews"("sellerId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "seller_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
