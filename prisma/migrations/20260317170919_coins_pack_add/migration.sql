-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'COIN_PURCHASE';

-- CreateTable
CREATE TABLE "CoinPack" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoinPack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoinPack_name_key" ON "CoinPack"("name");
