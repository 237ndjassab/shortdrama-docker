const { prisma } = require("../model/index.js");

class FavoriteService {
  static async toggleFavorite(userId, episodeId) {
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },

      select: {
        season: {
          select: {
            serieId: true,
          },
        },
      },
    });

    if (!episode) {
      throw new Error("Episode not found");
    }

    const seriesId = episode.season.serieId;

    const existingFavorite = await prisma.favoriteSeries.findUnique({
      where: {
        userId_seriesId: {
          userId,
          seriesId,
        },
      },
    });

    // REMOVE
    if (existingFavorite) {
      await prisma.favoriteSeries.delete({
        where: {
          userId_seriesId: {
            userId,
            seriesId,
          },
        },
      });

      return {
        favorited: false,
        seriesId,
      };
    }

    // ADD
    await prisma.favoriteSeries.create({
      data: {
        userId,
        seriesId,
      },
    });

    return {
      favorited: true,
      seriesId,
    };
  }

  static async getMyFavoriteSeries(userId) {
    return prisma.favoriteSeries.findMany({
      where: {
        userId,
      },

      include: {
        series: {
          include: {
            creator: true,
            category: true,

            seasons: {
              include: {
                episodes: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
module.exports = FavoriteService;
