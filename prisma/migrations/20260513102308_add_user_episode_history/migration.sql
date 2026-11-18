-- CreateTable
CREATE TABLE "user_episode_history" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "watchedDuration" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "rewatchCount" INTEGER NOT NULL DEFAULT 0,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstWatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastWatchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_episode_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_episode_history_userId_episodeId_key" ON "user_episode_history"("userId", "episodeId");

-- AddForeignKey
ALTER TABLE "user_episode_history" ADD CONSTRAINT "user_episode_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_episode_history" ADD CONSTRAINT "user_episode_history_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
