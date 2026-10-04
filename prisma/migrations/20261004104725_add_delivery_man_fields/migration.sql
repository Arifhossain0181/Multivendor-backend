/*
  Warnings:

  - Added the required column `city` to the `delivery_men` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "delivery_men" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "drivingLicenseImage" TEXT,
ADD COLUMN     "drivingLicenseNumber" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ADD COLUMN     "nidBackImage" TEXT,
ADD COLUMN     "nidFrontImage" TEXT,
ADD COLUMN     "nidNumber" TEXT,
ADD COLUMN     "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "serviceZones" TEXT,
ADD COLUMN     "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vehicleImage" TEXT,
ADD COLUMN     "vehicleRegistrationImage" TEXT,
ADD COLUMN     "vehicleRegistrationNumber" TEXT,
ADD COLUMN     "vehicleType" TEXT;
