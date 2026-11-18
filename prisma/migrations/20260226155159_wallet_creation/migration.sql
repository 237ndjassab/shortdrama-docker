-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('Active', 'Inactive');

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'InactiveUser';

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "biography" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "cover_url" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "phone" INTEGER;

-- CreateTable
CREATE TABLE "wallet" (
    "id" SERIAL NOT NULL,
    "balanceCoins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "lastTransactionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_userId_key" ON "wallet"("userId");

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
