-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ActiveUser', 'Banned');

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ActiveUser';
