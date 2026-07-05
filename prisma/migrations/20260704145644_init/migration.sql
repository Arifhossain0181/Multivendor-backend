-- AlterTable
ALTER TABLE "products" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
