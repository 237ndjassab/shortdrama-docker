/*
  Warnings:

  - You are about to drop the `Season` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `seasonId` to the `episode` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Season" DROP CONSTRAINT "Season_serieId_fkey";

-- AlterTable
ALTER TABLE "episode" ADD COLUMN     "seasonId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Season";

-- CreateTable
CREATE TABLE "season" (
    "id" SERIAL NOT NULL,
    "number" SERIAL NOT NULL,
    "description" TEXT,
    "serieId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "season_serieId_number_key" ON "season"("serieId", "number");

-- AddForeignKey
ALTER TABLE "season" ADD CONSTRAINT "season_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode" ADD CONSTRAINT "episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
