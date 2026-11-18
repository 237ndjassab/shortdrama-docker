-- CreateTable
CREATE TABLE "favorite_series" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_series_userId_seriesId_key" ON "favorite_series"("userId", "seriesId");

-- AddForeignKey
ALTER TABLE "favorite_series" ADD CONSTRAINT "favorite_series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_series" ADD CONSTRAINT "favorite_series_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
