-- CreateEnum
CREATE TYPE "CreatorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "creator_profile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "CreatorStatus" NOT NULL DEFAULT 'PENDING',
    "bio" TEXT,
    "portfolio" TEXT,
    "youtubeUrl" TEXT,
    "instagramUrl" TEXT,
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorStats" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "CreatorStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_profile_userId_key" ON "creator_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorStats_userId_key" ON "CreatorStats"("userId");

-- AddForeignKey
ALTER TABLE "creator_profile" ADD CONSTRAINT "creator_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorStats" ADD CONSTRAINT "CreatorStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
