-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "balanceCashAfter" DROP NOT NULL,
ALTER COLUMN "balanceCashBefore" DROP NOT NULL;
