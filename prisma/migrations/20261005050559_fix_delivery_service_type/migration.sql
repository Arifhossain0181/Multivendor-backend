/*
  Warnings:

  - The `vehicleType` column on the `delivery_men` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `serviceType` column on the `delivery_men` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "delivery_men" DROP COLUMN "vehicleType",
ADD COLUMN     "vehicleType" TEXT[],
DROP COLUMN "serviceType",
ADD COLUMN     "serviceType" TEXT[];
