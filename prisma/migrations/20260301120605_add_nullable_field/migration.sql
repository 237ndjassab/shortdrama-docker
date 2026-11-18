-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "balanceCoinsAfter" DROP NOT NULL,
ALTER COLUMN "balanceCoinsBefore" DROP NOT NULL;
