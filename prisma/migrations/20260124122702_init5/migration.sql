/*
  Warnings:

  - The `otpcode` column on the `utilisateurs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "utilisateurs" DROP COLUMN "otpcode",
ADD COLUMN     "otpcode" INTEGER;
