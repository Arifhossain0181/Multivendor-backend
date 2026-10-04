/*
  Warnings:

  - You are about to drop the column `vehicleRegistrationNumber` on the `delivery_men` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `delivery_men` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `delivery_men` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identityType` to the `delivery_men` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `delivery_men` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobileNumber` to the `delivery_men` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceType` to the `delivery_men` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "delivery_men" DROP COLUMN "vehicleRegistrationNumber",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "fitnessNumber" TEXT,
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "identityNumber" TEXT,
ADD COLUMN     "identityType" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "mobileNumber" TEXT NOT NULL,
ADD COLUMN     "profilePhoto" TEXT,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "registrationCategory" TEXT,
ADD COLUMN     "registrationDigits" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "registrationRegion" TEXT,
ADD COLUMN     "serviceType" TEXT NOT NULL,
ADD COLUMN     "taxTokenNumber" TEXT,
ADD COLUMN     "vehicleBrand" TEXT,
ADD COLUMN     "vehicleModel" TEXT,
ADD COLUMN     "vehicleYear" TEXT;
