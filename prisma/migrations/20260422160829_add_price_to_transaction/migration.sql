-- AlterTable
ALTER TABLE "episode" ALTER COLUMN "episodeNumber" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "price" DECIMAL(12,2);
