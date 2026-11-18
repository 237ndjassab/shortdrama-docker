-- CreateEnum
CREATE TYPE "SlideType" AS ENUM ('SERIE', 'EPISODE', 'PREMIUM', 'COINPACK', 'EXTERNAL_LINK', 'ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "slides" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT,
    "streamingUrl" TEXT,
    "trailerUrl" TEXT,
    "trailerPublicId" TEXT,
    "buttonText" TEXT,
    "buttonLink" TEXT,
    "type" "SlideType" NOT NULL DEFAULT 'SERIE',
    "serieId" INTEGER,
    "episodeId" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
