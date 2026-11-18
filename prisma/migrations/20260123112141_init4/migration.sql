-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "otpcode" TEXT;
