/*
  Warnings:

  - You are about to drop the column `balanceAfter` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `balanceBefore` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `balanceCashAfter` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceCashBefore` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceCoinsAfter` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceCoinsBefore` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_walletId_fkey";

-- DropForeignKey
ALTER TABLE "wallet" DROP CONSTRAINT "wallet_userId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "balanceAfter",
DROP COLUMN "balanceBefore",
ADD COLUMN     "balanceCashAfter" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "balanceCashBefore" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "balanceCoinsAfter" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "balanceCoinsBefore" DECIMAL(12,2) NOT NULL;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
