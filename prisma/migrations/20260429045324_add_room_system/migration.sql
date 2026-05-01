/*
  Warnings:

  - You are about to drop the column `propertyId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `bathrooms` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `beds` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `cleaningFee` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `guests` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerNight` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFee` on the `Property` table. All the data in the column will be lost.
  - Added the required column `roomId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('STANDARD', 'VIP', 'DELUXE', 'SUITE');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_propertyId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "propertyId",
ADD COLUMN     "roomId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "bathrooms",
DROP COLUMN "bedrooms",
DROP COLUMN "beds",
DROP COLUMN "cleaningFee",
DROP COLUMN "guests",
DROP COLUMN "pricePerNight",
DROP COLUMN "serviceFee";

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RoomType" NOT NULL DEFAULT 'STANDARD',
    "description" TEXT,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "cleaningFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "guests" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "beds" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "roomCount" INTEGER NOT NULL DEFAULT 1,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
