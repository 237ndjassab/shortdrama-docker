-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "serieId" INTEGER NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
