/*
  Warnings:

  - You are about to alter the column `balanceCoins` on the `wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `totalEarned` on the `wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.

*/
-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('DEPOSIT', 'WITHDRAW', 'PURCHASE', 'COMMISSION');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- AlterTable
ALTER TABLE "wallet" ALTER COLUMN "balanceCoins" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "totalEarned" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "totalSpent" SET DEFAULT 0.00,
ALTER COLUMN "totalSpent" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "source" "TransactionSource" NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "walletId" INTEGER NOT NULL,
    "episodeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
