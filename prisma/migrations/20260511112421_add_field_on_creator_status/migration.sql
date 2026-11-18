/*
  Warnings:

  - You are about to drop the column `bio` on the `creator_profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "creator_profile" DROP COLUMN "bio",
ADD COLUMN     "biography" TEXT,
ADD COLUMN     "country" TEXT;
