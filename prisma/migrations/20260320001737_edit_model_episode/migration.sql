/*
  Warnings:

  - You are about to drop the column `price` on the `episode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "episode" DROP COLUMN "price",
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceCoins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videoUrl" TEXT;
