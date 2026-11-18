/*
  Warnings:

  - You are about to drop the `UserHasRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserHasRole" DROP CONSTRAINT "UserHasRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserHasRole" DROP CONSTRAINT "UserHasRole_userId_fkey";

-- DropTable
DROP TABLE "UserHasRole";

-- CreateTable
CREATE TABLE "user_has_role" (
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_has_role_pkey" PRIMARY KEY ("userId","roleId")
);

-- AddForeignKey
ALTER TABLE "user_has_role" ADD CONSTRAINT "user_has_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_has_role" ADD CONSTRAINT "user_has_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
