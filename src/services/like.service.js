const { prisma } = require("../model/index.js");

class LikeService {
  /**
   * Toggle like on an episode
   * @param {number} userId
   * @param {number} episodeId
   * @returns {Promise<{ liked: boolean }>}
   */
  static async toggleLike(userId, episodeId) {
    return await prisma.$transaction(async (tx) => {
      // 🔍 récupérer épisode + série
      const episode = await tx.episode.findUnique({
        where: { id: episodeId },
        include: {
          season: {
            include: {
              serie: true,
            },
          },
        },
      });

      if (!episode) {
        throw new Error(`Episode ${episodeId} not found`);
      }

      const serieId = episode.season.serie.id;

      // 🔍 vérifier like existant
      const existingLike = await tx.like.findUnique({
        where: {
          userId_episodeId: {
            userId,
            episodeId,
          },
        },
      });

      // ❌ UNLIKE
      if (existingLike) {
        await tx.like.delete({
          where: { id: existingLike.id },
        });

        await tx.episode.update({
          where: { id: episodeId },
          data: {
            likesCount: { decrement: 1 },
          },
        });

        await tx.series.update({
          where: { id: serieId },
          data: {
            totalLikes: { decrement: 1 },
          },
        });

        await tx.userEpisodeHistory.upsert({
          where: {
            userId_episodeId: {
              userId,
              episodeId,
            },
          },
          update: {
            liked: false,
          },
          create: {
            userId,
            episodeId,
            liked: false,
          },
        });

        const creatorStats = await tx.creatorStats.findUnique({
          where: { userId: episode.creatorId },
        });
        userId: episode.season.serie.creatorId;

        if (creatorStats) {
          await tx.creatorStats.update({
            where: { userId: episode.creatorId },
            data: {
              totalLikes: { decrement: 1 },
            },
          });
        }

        return { liked: false, episodeId };
      }

      // ✅ LIKE
      await tx.like.create({
        data: {
          userId,
          episodeId,
        },
      });

      await tx.episode.update({
        where: { id: episodeId },
        data: {
          likesCount: { increment: 1 },
        },
      });

      await tx.series.update({
        where: { id: serieId },
        data: {
          totalLikes: { increment: 1 },
        },
      });

      await tx.creatorStats.upsert({
        where: { userId: episode.creatorId },
        update: {
          totalLikes: { increment: 1 },
        },
        create: {
          userId: episode.creatorId,
          totalLikes: 1,
          totalViews: 0,
          earnings: 0,
        },
      });

      await tx.userEpisodeHistory.upsert({
        where: {
          userId_episodeId: {
            userId,
            episodeId,
          },
        },
        update: {
          liked: true,
        },
        create: {
          userId,
          episodeId,
          liked: true,
        },
      });

      return { liked: true, episodeId };
    });
  }
}

module.exports = { LikeService };
