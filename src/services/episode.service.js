// const { Prisma } = require("@prisma/client");
const cloudinary = require("../config/cloudinary.config.js");
const { prisma } = require("../model/index.js");

class EpisodeService {
  static async buyEpisode(userId, episodeId) {
    return await prisma.$transaction(async (tx) => {
      //on verifie que l'episode existe
      const episode = await tx.episode.findUnique({
        where: {
          id: episodeId,
        },
        include: {
          creator: {
            include: {
              wallet: true,
            },
          },
          season: {
            include: {
              serie: true,
            },
          },
        },
      });
      if (!episode) {
        throw new Error("Episode not found");
      }
      //on empeche que l'utilisateur puisse acheter son propre episode
      if (episode.creatorId === userId) {
        throw new Error("You cannot buy your own episode");
      }
      //on verifie si deja achete
      const existingPurchase = await tx.purchase.findUnique({
        where: {
          userId_episodeId: {
            userId,
            episodeId,
          },
        },
      });
      if (existingPurchase) {
        throw new Error("Episode already purchased");
      }
      //on verifie que l'utilisateur a assez de coins
      const buyerWallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });
      if (!buyerWallet) {
        throw new Error("Wallet not found");
      }
      //debiter l'acheteur
      if (buyerWallet.balanceCoins < episode.priceCoins) {
        throw new Error("Insufficient coins");
      }
      await tx.wallet.update({
        where: {
          id: buyerWallet.id,
        },
        data: {
          balanceCoins: {
            decrement: episode.priceCoins,
          },
          totalSpent: {
            increment: episode.priceCoins,
          },
          lastTransactionAt: new Date(),
        },
      });

      //crediter le createur
      const coinToCashRate = 10;
      const COMMISSION_PERCENT = 10;
      const commissionCoins = Math.floor(
        (episode.priceCoins * COMMISSION_PERCENT) / 100,
      );
      const commissionCash = commissionCoins * coinToCashRate;

      const creatorGainCoins = episode.priceCoins - commissionCoins;
      const creatorGainCash = creatorGainCoins * coinToCashRate;

      const creatorWallet = episode.creator.wallet;
      if (!creatorWallet) {
        throw new Error("Creator wallet not found");
      }
      await tx.wallet.update({
        where: {
          id: creatorWallet.id,
        },
        data: {
          balance: {
            increment: creatorGainCash, //on doit multiplier par le taux du coins : que l'on va calculer en fonction des pays; par exemple si au cameroun 1 coin = 10fcfa; 100coins = 1000fcfa. donc apres avoir depensé 100coins pour acheter un episode on va incrementer le compte createur de 100coins * 10
          },
          totalEarned: {
            increment: creatorGainCash, //meme chose ici
          },
          lastTransactionAt: new Date(),
        },
      });

      await tx.creatorStats.upsert({
        where: {
          userId: episode.creatorId,
        },

        update: {
          totalSales: {
            increment: 1,
          },

          earnings: {
            increment: creatorGainCash,
          },
        },

        create: {
          userId: episode.creatorId,

          totalSales: 1,

          earnings: creatorGainCash,
        },
      });

      await tx.episode.update({
        where: {
          id: episodeId,
        },
        data: {
          purchaseCount: {
            increment: 1,
          },
        },
      });

      //crediter le System wallet
      const systemUser = await tx.utilisateur.findFirst({
        where: {
          isSystem: true,
        },
        include: {
          wallet: true,
        },
      });
      if (!systemUser || !systemUser.wallet) {
        throw new Error("System user or wallet not found");
      }
      await tx.wallet.update({
        where: {
          id: systemUser.wallet.id,
        },
        data: {
          balance: {
            increment: commissionCash, // meme chose ici.
          },
          totalEarned: {
            increment: commissionCash,
          },
          lastTransactionAt: new Date(),
        },
      });

      //enregistrer la transaction de l'acheteur
      await tx.transaction.create({
        data: {
          walletId: buyerWallet.id,
          amount: episode.priceCoins,
          type: "DEBIT",
          source: "PURCHASE",
          balanceCoinsBefore: buyerWallet.balanceCoins,
          balanceCoinsAfter: buyerWallet.balanceCoins - episode.priceCoins,
          episodeId,
        },
      });

      //enregistrer la transaction du createur
      await tx.transaction.create({
        data: {
          walletId: creatorWallet.id,
          amount: creatorGainCash,
          type: "CREDIT",
          source: "SELL_EPISODE",
          balanceCashBefore: creatorWallet.balance,
          balanceCashAfter: creatorWallet.balance + creatorGainCash,
          episodeId,
        },
      });

      //enregistrer la transaction de la plateforme
      await tx.transaction.create({
        data: {
          walletId: systemUser.wallet.id,
          amount: commissionCash,
          type: "CREDIT",
          source: "COMMISSION",
          balanceCashBefore: systemUser.wallet.balance,
          balanceCashAfter: systemUser.wallet.balance + commissionCash,
          episodeId,
        },
      });

      await tx.episodeRevenue.create({
        data: {
          episodeId,
          creatorId: episode.creatorId,
          buyerId: userId,

          coinsPaid: episode.priceCoins,

          grossAmount: episode.priceCoins * coinToCashRate,

          commissionAmount: commissionCash,

          creatorAmount: creatorGainCash,
        },
      });

      //enregistrer l'achat
      await tx.purchase.create({
        data: {
          userId,
          episodeId,
        },
      });
      return {
        success: true,

        purchase: {
          episodeId: episode.id,
          title: episode.title,
          priceCoins: episode.priceCoins,
        },

        serie: {
          id: episode.season.serie.id,
          title: episode.season.serie.title,
          thumbnail: episode.season.serie.thumbnail,
        },
      };
    });
  }

  static async saveProgress(data) {
    const { userId, episodeId, watchedDuration, progressPercent, completed } =
      data;

    const existing = await prisma.userEpisodeHistory.findUnique({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },
    });

    // Détection rewatch
    let rewatchCount = existing?.rewatchCount || 0;

    if (existing?.completed && progressPercent < 10) {
      rewatchCount += 1;
    }

    // Détection skip
    const skipped = watchedDuration < 15 && progressPercent < 10;

    return prisma.userEpisodeHistory.upsert({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },

      update: {
        watchedDuration: Math.max(
          watchedDuration,
          existing?.watchedDuration || 0,
        ),

        progressPercent: Math.max(
          progressPercent,
          existing?.progressPercent || 0,
        ),

        completed,
        skipped,
        rewatchCount,
      },

      create: {
        userId,
        episodeId,
        watchedDuration,
        progressPercent,
        completed,
        skipped,
        rewatchCount,
      },
    });
  }

  static async getContinueWatching(userId) {
    const history = await prisma.userEpisodeHistory.findMany({
      where: {
        userId,

        completed: false,

        progressPercent: {
          gt: 5,
          lt: 90,
        },
      },

      include: {
        episode: {
          include: {
            creator: true,

            season: {
              include: {
                serie: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        lastWatchedAt: "desc",
      },

      take: 20,
    });

    return history.map((item) => ({
      progressPercent: item.progressPercent,
      watchedDuration: item.watchedDuration,
      updatedAt: item.lastWatchedAt,

      episode: item.episode,

      series: item.episode.season.serie,
    }));
  }

  static async getAllHistory(userId) {
    const history = await prisma.userEpisodeHistory.findMany({
      where: { userId },

      include: {
        episode: {
          include: {
            creator: true,

            season: {
              include: {
                serie: {
                  include: {
                    category: true,
                    seasons: {
                      include: {
                        _count: {
                          select: {
                            episodes: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        lastWatchedAt: "desc",
      },

      take: 20,
    });

    return history.map((item) => {
      const serie = item.episode.season.serie;

      const totalEpisodes = serie.seasons.reduce(
        (acc, season) => acc + season._count.episodes,
        0,
      );

      return {
        id: item.id,
        progressPercent: item.progressPercent,
        watchedDuration: item.watchedDuration,
        updatedAt: item.lastWatchedAt,

        episode: item.episode,

        series: {
          ...serie,
          totalEpisodes,
        },
      };
    });
  }

  static async create({
    title,
    description,
    priceCoins,
    seasonId,
    userId,
    videoUrl,
    streamingUrl,
    thumbnail,
    duration,
    videoPublicId,
  }) {
    if (!title || !seasonId || !videoUrl) {
      throw new Error("Missing required fields");
    }

    // 🔍 Vérifier season
    const season = await prisma.season.findUnique({
      where: { id: parseInt(seasonId) },
      include: { serie: true },
    });

    if (!season) {
      throw new Error("Season not found");
    }

    // 🔐 Ownership check
    if (season.serie.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    // 🔥 Auto episodeNumber
    const lastEpisode = await prisma.episode.findFirst({
      where: { seasonId: season.id },
      orderBy: { episodeNumber: "desc" },
    });

    const episodeNumber = lastEpisode ? lastEpisode.episodeNumber + 1 : 1;

    return await prisma.episode.create({
      data: {
        title,
        description,
        videoUrl,
        streamingUrl,
        thumbnail,
        duration,
        videoPublicId,
        priceCoins: parseInt(priceCoins) || 0,
        seasonId: season.id,
        creatorId: userId,
        episodeNumber,
      },
    });
  }

  static async getBySeason(seasonId, userId) {
    const episodes = await prisma.episode.findMany({
      where: {
        seasonId,
        isActive: true,
      },

      include: {
        creator: true,

        season: {
          include: {
            serie: true,
          },
        },
        likes: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },
        purchases: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    return episodes.map((ep) => {
      const isOwner = ep.creatorId === userId;

      return {
        ...ep,

        isLiked: ep.likes.length > 0,

        // acheté OU propriétaire
        isPurchased: ep.purchases.length > 0 || isOwner,

        likes: undefined,
        purchases: undefined,
      };
    });
  }

  static async incrementViews(episodeId) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. récupérer l’épisode avec sa série
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

        // 2. incrémenter l'épisode
        const updatedEpisode = await tx.episode.update({
          where: { id: episodeId },
          data: {
            views: { increment: 1 },
          },
        });

        // 3. incrémenter la série
        await tx.series.update({
          where: { id: episode.season.serie.id },
          data: {
            totalViews: { increment: 1 },
          },
        });

        //4. incrementer creator stats si episode creator stats existe
        await tx.creatorStats.upsert({
          where: {
            userId: episode.creatorId,
          },
          update: {
            totalViews: {
              increment: 1,
            },
          },
          create: {
            userId: episode.creatorId,
            totalViews: 1,
          },
        });

        return updatedEpisode;
      });
    } catch (error) {
      console.error("Erreur incrementViews:", error);
      throw error;
    }
  }
  static async getFeed({ page, limit, userId }) {
    const offset = (page - 1) * limit;

    return prisma.$queryRaw`
    SELECT
      e.*,

      -- 👤 creator
      json_build_object(
        'id', u.id,
        'name', u.name,
        'avatar_url', u.avatar_url
      ) AS "creator",

      -- 🎬 season
      json_build_object(
        'id', s.id,
        'number', s.number
      ) AS "season",

      -- 📺 series (via season)
      json_build_object(
        'id', se.id,
        'title', se.title,
        'description', se.description,
        'thumbnail', se.thumbnail
      ) AS "series",

      -- ❤️ isLiked
      CASE
        WHEN l.id IS NOT NULL THEN true
        ELSE false
      END AS "isLiked"

    FROM "episode" e

    -- creator
    JOIN "utilisateurs" u
      ON e."creatorId" = u.id

    -- season
    JOIN "season" s
      ON e."seasonId" = s.id

    -- series
    JOIN "series" se
      ON s."serieId" = se.id

    -- like
    LEFT JOIN "Like" l
      ON l."episodeId" = e.id
      AND l."userId" = ${userId}

    WHERE e."isActive" = true
      AND e."priceCoins" = 0

    ORDER BY (
      e."views" * 0.2 +
      e."likesCount" * 0.2 +
      EXTRACT(EPOCH FROM e."createdAt") * 0.000001 +
      RANDOM() * 0.599999
    ) DESC

    LIMIT ${limit}
    OFFSET ${offset}
  `;
  }

  static async getById(id) {
    const episode = await prisma.episode.findUnique({
      where: { id, isActive: true },
      include: {
        season: {
          include: {
            serie: true,
          },
        },
      },
    });

    if (!episode) {
      throw new Error("Episode not found");
    }

    return episode;
  }

  static async update(id, data, userId) {
    const episode = await prisma.episode.findUnique({
      where: { id },
      include: {
        season: {
          include: { serie: true },
        },
      },
    });

    if (!episode) {
      throw new Error("Episode not found");
    }

    if (episode.season.serie.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    return await prisma.episode.update({
      where: { id },
      data,
    });
  }

  static async delete(id, userId) {
    const episode = await prisma.episode.findUnique({
      where: { id },
      include: {
        season: {
          include: {
            serie: true,
          },
        },
      },
    });

    if (!episode) {
      throw new Error("Episode not found");
    }

    if (episode.season.serie.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    // =========================
    // DELETE CLOUDINARY ASSETS
    // =========================

    if (episode.videoPublicId) {
      await cloudinary.uploader.destroy(episode.videoPublicId, {
        resource_type: "video",
      });
    }

    if (episode.thumbnailPublicId) {
      await cloudinary.uploader.destroy(episode.thumbnailPublicId);
    }

    // =========================
    // DELETE DATABASE
    // =========================

    await prisma.episode.delete({
      where: {
        id,
      },
    });

    return {
      id: episode.id,
      success: true,
    };
  }
}

module.exports = { EpisodeService };
