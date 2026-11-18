/*
  Warnings:

  - A unique constraint covering the columns `[seasonId,episodeNumber]` on the table `episode` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "episode_title_creatorId_key";

-- AlterTable
ALTER TABLE "episode" ADD COLUMN     "episodeNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streamingUrl" TEXT,
ADD COLUMN     "thumbnail" TEXT,
ADD COLUMN     "videoPublicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "episode_seasonId_episodeNumber_key" ON "episode"("seasonId", "episodeNumber");
