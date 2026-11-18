-- AlterTable
ALTER TABLE "CreatorStats" ADD COLUMN     "totalSales" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "episode" ADD COLUMN     "purchaseCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "episode_revenues" (
    "id" SERIAL NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "coinsPaid" INTEGER NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "commissionAmount" DECIMAL(12,2) NOT NULL,
    "creatorAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episode_revenues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "episode_revenues_episodeId_idx" ON "episode_revenues"("episodeId");

-- CreateIndex
CREATE INDEX "episode_revenues_creatorId_idx" ON "episode_revenues"("creatorId");

-- CreateIndex
CREATE INDEX "episode_revenues_buyerId_idx" ON "episode_revenues"("buyerId");

-- AddForeignKey
ALTER TABLE "episode_revenues" ADD CONSTRAINT "episode_revenues_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_revenues" ADD CONSTRAINT "episode_revenues_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_revenues" ADD CONSTRAINT "episode_revenues_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
