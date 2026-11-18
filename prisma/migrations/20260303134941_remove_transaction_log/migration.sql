/*
  Warnings:

  - You are about to drop the `transaction_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "transaction_logs" DROP CONSTRAINT "transaction_logs_userId_fkey";

-- DropTable
DROP TABLE "transaction_logs";

-- DropEnum
DROP TYPE "LogAction";
