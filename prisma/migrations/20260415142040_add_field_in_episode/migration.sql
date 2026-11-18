/*
  Warnings:

  - You are about to alter the column `balanceCoinsAfter` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Integer`.
  - You are about to alter the column `balanceCoinsBefore` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Integer`.
  - You are about to alter the column `balanceCoins` on the `wallet` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "episode" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "series" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trailerUrl" TEXT;

-- AlterTable
ALTER TABLE "transaction" ALTER COLUMN "balanceCoinsAfter" SET DATA TYPE INTEGER,
ALTER COLUMN "balanceCoinsBefore" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "wallet" ALTER COLUMN "balanceCoins" SET DEFAULT 0,
ALTER COLUMN "balanceCoins" SET DATA TYPE INTEGER;
