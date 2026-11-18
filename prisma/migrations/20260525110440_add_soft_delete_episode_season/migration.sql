-- AlterTable
ALTER TABLE "episode" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "thumbnailPublicId" TEXT;

-- AlterTable
ALTER TABLE "season" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
