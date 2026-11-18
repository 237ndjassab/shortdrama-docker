-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('BUY_EPISODE', 'EPISODE_SALE', 'DEPOSIT', 'WITHDRAW', 'REFUND');

-- CreateTable
CREATE TABLE "transaction_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" "LogAction" NOT NULL,
    "amount" DECIMAL(12,2),
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_logs_userId_idx" ON "transaction_logs"("userId");

-- AddForeignKey
ALTER TABLE "transaction_logs" ADD CONSTRAINT "transaction_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
