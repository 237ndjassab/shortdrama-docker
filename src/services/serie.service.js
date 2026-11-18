const cloudinary = require("../config/cloudinary.config.js");
const { prisma } = require("../model/index.js");

class SeriesService {
  static async create(data) {
    const {
      title,
      description,
      language,
      countryOrigin,
      thumbnail,
      thumbnailPublicId, // ✅ AJOUT
      trailerPublicId, // ✅ AJOUT
      trailerUrl,
      categoryId,
      creatorId,
    } = data;

    if (!title) throw new Error("Title is a required field");
    if (!countryOrigin) throw new Error("country Origin is required");
    if (!categoryId) throw new Error("Category is required");

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      throw new Error("Invalid category");
    }

    return await prisma.series.create({
      data: {
        title,
        description,
        language,
        thumbnail,
        thumbnailPublicId, // ✅
        trailerPublicId, // ✅
        trailerUrl,
        countryOrigin,
        categoryId,
        creatorId,
        publishedAt: new Date(),
      },
    });
  }

  static async getPaginated({
    page = 1,
    limit = 10,
    search,
    categoryId,
    sortBy = "createdAt",
    order = "desc",
  }) {
    const take = Math.min(Number(limit), 50); // 🔥 limite max sécurité
    const skip = (Number(page) - 1) * take;

    // 🎯 construction dynamique du WHERE
    const where = {
      ...(search && {
        title: {
          contains: search.toString(),
          // mode: "insensitive",
        },
      }),

      ...(categoryId && {
        categoryId: Number(categoryId),
      }),
    };

    // 🎯 sécuriser le tri (important en prod)
    const allowedSortFields = ["createdAt", "title", "publishedAt"];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeOrder = order === "asc" ? "asc" : "desc";

    const [series, total] = await prisma.$transaction([
      prisma.series.findMany({
        where,
        skip,
        take,
        orderBy: {
          [safeSortBy]: safeOrder,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
              country: true,
            },
          },
          category: true,
          seasons: {
            select: {
              _count: {
                select: {
                  episodes: true,
                },
              },
            },
          },
        },
      }),

      prisma.series.count({ where }),
    ]);

    // 🎯 transformation des données
    const formatted = series.map((serie) => {
      const totalEpisodes = serie.seasons.reduce(
        (acc, season) => acc + season._count.episodes,
        0,
      );

      return {
        id: serie.id,
        title: serie.title,
        isActive: serie.isActive,
        isPublished: serie.isPublished,
        thumbnail: serie.thumbnail,
        createdAt: serie.createdAt,
        description: serie.description,

        creator: serie.creator,
        category: serie.category,

        totalEpisodes,
      };
    });
    const totalPages = Math.ceil(total / take);

    return {
      data: formatted,
      meta: {
        total,
        page: Number(page),
        prevPage: skip ? Number(page) - 1 : null,
        limit: take,
        totalPages,
        nextpage: totalPages - Number(page) ? Number(page) + 1 : null,
      },
    };
  }

  static async getFullSeries(seriesId) {
    return prisma.series.findUnique({
      where: {
        id: seriesId,
      },

      include: {
        seasons: {
          orderBy: {
            number: "asc",
          },

          include: {
            episodes: {
              orderBy: {
                episodeNumber: "asc",
              },

              select: {
                id: true,
                title: true,
                description: true,
                videoUrl: true,
                streamingUrl: true,
                thumbnail: true,
                episodeNumber: true,
                duration: true,
                priceCoins: true,
                views: true,
                likesCount: true,
                isPublished: true,
                createdAt: true,
              },
            },
          },
        },

        category: true,

        creator: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  static async getTrending(limit = 10) {
    const series = await prisma.series.findMany({
      where: {
        isPublished: true,
        isActive: true,
      },
      include: {
        creator: true,
        category: true,
      },
    });
    console.log("ALL SERIES:", series.length);
    console.log("Filtered series:", series);

    return series
      .map((s) => {
        const daysSinceRelease =
          (Date.now() - new Date(s.publishedAt)) / (1000 * 60 * 60 * 24);
        const score =
          s.totalViews * 1 + s.totalLikes * 5 - daysSinceRelease * 2; // pénalité temporelle

        return { ...s, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  static async getLatest(limit = 10) {
    const series = await prisma.series.findMany({
      where: {
        isPublished: true,
        isActive: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: Number(limit),
      include: {
        creator: true,
        category: true,
      },
    });

    console.log("LATEST SERIES:", series.length);

    return series;
  }

  static async getFeatured(limit = 10) {
    return await prisma.series.findMany({
      where: {
        isFeatured: true,
        isPublished: true,
        isActive: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: Number(limit),
      include: {
        creator: true,
        category: true,
      },
    });
  }

  static async getRecommended(userId, limit = 10) {
    // =========================
    // 1. HISTORIQUE USER
    // =========================

    const history = await prisma.userEpisodeHistory.findMany({
      where: {
        userId,
      },

      include: {
        episode: {
          include: {
            season: {
              include: {
                serie: true,
              },
            },
          },
        },
      },
    });

    // =========================
    // 2. USER SANS HISTORIQUE
    // =========================

    if (history.length === 0) {
      return prisma.series.findMany({
        where: {
          isActive: true,
          isPublished: true,
        },

        include: {
          creator: true,
          category: true,
        },

        orderBy: [
          {
            totalViews: "desc",
          },

          {
            totalLikes: "desc",
          },

          {
            publishedAt: "desc",
          },
        ],

        take: limit,
      });
    }

    // =========================
    // 3. CATÉGORIES FAVORITES
    // =========================

    const categoryScores = {};

    for (const item of history) {
      const serie = item.episode.season.serie;

      const categoryId = serie.categoryId;

      let score = 1;

      // bonus completion
      if (item.completed) {
        score += 3;
      }

      // bonus gros watch time
      if (item.progressPercent > 70) {
        score += 2;
      }

      // bonus rewatch
      score += item.rewatchCount * 2;

      categoryScores[categoryId] = (categoryScores[categoryId] || 0) + score;
    }

    // =========================
    // 4. TOP CATÉGORIES
    // =========================

    const favoriteCategories = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoryId]) => Number(categoryId));

    // =========================
    // 5. SÉRIES DÉJÀ VUES
    // =========================

    const watchedSeriesIds = [
      ...new Set(history.map((h) => h.episode.season.serie.id)),
    ];

    // =========================
    // 6. RECOMMANDATIONS
    // =========================

    let recommendations = await prisma.series.findMany({
      where: {
        isActive: true,
        isPublished: true,

        id: {
          notIn: watchedSeriesIds,
        },

        OR: [
          {
            categoryId: {
              in: favoriteCategories,
            },
          },

          {
            isFeatured: true,
          },
        ],
      },

      include: {
        creator: true,
        category: true,
      },

      orderBy: [
        {
          totalViews: "desc",
        },

        {
          totalLikes: "desc",
        },

        {
          publishedAt: "desc",
        },
      ],

      take: limit,
    });

    // =========================
    // FALLBACK TRENDING
    // =========================

    if (recommendations.length < limit) {
      const missing = limit - recommendations.length;

      const fallback = await prisma.series.findMany({
        where: {
          isActive: true,
          isPublished: true,

          id: {
            notIn: [...watchedSeriesIds, ...recommendations.map((r) => r.id)],
          },
        },

        include: {
          creator: true,
          category: true,
        },

        orderBy: [
          {
            totalViews: "desc",
          },

          {
            totalLikes: "desc",
          },

          {
            publishedAt: "desc",
          },
        ],

        take: missing,
      });

      recommendations = [...recommendations, ...fallback];
    }

    return recommendations;
  }

  static async getRandomContent(limit = 10) {
    const randomIds = await prisma.$queryRaw`

      SELECT id
      FROM "series"
      WHERE "isPublished" = true
      ORDER BY RANDOM()
      LIMIT ${limit}

    `;

    const ids = randomIds.map((item) => item.id);

    return prisma.series.findMany({
      where: {
        id: {
          in: ids,
        },
      },

      include: {
        creator: true,
        category: true,
      },
    });
  }

  static async getHome(userId) {
    const [trending, latest, recommended, random, featured] = await Promise.all(
      [
        this.getTrending(10),
        this.getLatest(10),
        this.getRecommended(userId, 10),
        this.getRandomContent(10),
        // this.getFeatured(10),
      ],
    );

    return {
      trending,
      // featured,
      latest,
      recommended,
      random,
    };
  }

  static async getSeriePaginateByAdminId({
    page = 1,
    limit = 10,
    search,
    categoryId,
    creatorId,
    sortBy = "createdAt",
    order = "desc",
  }) {
    const take = Math.min(Number(limit), 50); // 🔥 limite max sécurité
    const skip = (Number(page) - 1) * take;

    // 🎯 construction dynamique du WHERE
    const where = {
      ...(search && {
        title: {
          contains: search.toString(),
          // mode: "insensitive",
        },
      }),

      ...(categoryId && {
        categoryId: Number(categoryId),
      }),

      ...(creatorId && {
        creatorId: Number(creatorId), // 👈 filtre admin
      }),
    };

    // 🎯 sécuriser le tri (important en prod)
    const allowedSortFields = ["createdAt", "title", "publishedAt"];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeOrder = order === "asc" ? "asc" : "desc";

    const [series, total] = await prisma.$transaction([
      prisma.series.findMany({
        where,
        skip,
        take,
        orderBy: {
          [safeSortBy]: safeOrder,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          category: true,
          seasons: {
            select: {
              _count: {
                select: {
                  episodes: true,
                },
              },
            },
          },
        },
      }),

      prisma.series.count({ where }),
    ]);

    // 🎯 transformation des données
    const formatted = await Promise.all(
      series.map(async (serie) => {
        const totalEpisodes = serie.seasons.reduce(
          (acc, season) => acc + season._count.episodes,
          0,
        );
        const retention = await prisma.userEpisodeHistory.aggregate({
          where: {
            episode: {
              season: {
                serieId: serie.id,
              },
            },
          },
          _avg: {
            progressPercent: true,
          },
        });

        return {
          id: serie.id,
          title: serie.title,
          isActive: serie.isActive,
          isPublished: serie.isPublished,
          thumbnail: serie.thumbnail,
          createdAt: serie.createdAt,

          creator: serie.creator,
          category: serie.category,
          retention: Math.round(retention._avg.progressPercent || 0),

          totalEpisodes,
        };
      }),
    );
    const totalPages = Math.ceil(total / take);

    return {
      data: formatted,
      meta: {
        total,
        page: Number(page),
        prevPage: skip ? Number(page) - 1 : null,
        limit: take,
        totalPages,
        nextpage: totalPages - Number(page) ? Number(page) + 1 : null,
      },
    };
  }
  static async getByCategory(categoryId) {
    return await prisma.series.findMany({
      where: {
        categoryId,
        isActive: true,
        isPublished: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async getAll() {
    return await prisma.series.findMany({
      where: {
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            badge: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getById(id) {
    const serie = await prisma.series.findUnique({
      where: { id },
      include: {
        creator: true,
        category: true,
        seasons: {
          include: {
            episodes: true,
          },
        },
      },
    });
    if (!serie) {
      throw new Error("Serie not found");
    }
    const totalSeasons = serie.seasons.length;
    const totalEpisodes = serie.seasons.reduce(
      (acc, season) => acc + season.episodes.length,
      0,
    );
    return {
      ...serie,
      totalSeasons,
      totalEpisodes,
    };
  }

  static async update(id, data, userId) {
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: {
          id: data.categoryId,
        },
      });
      if (!category || !category.isActive) {
        throw new Error("Invalid category");
      }
    }
    const serie = await prisma.series.findUnique({
      where: { id },
    });
    if (!serie) {
      throw new Error("series not found");
    }
    if (serie.creatorId !== userId) {
      throw new Error("Unauthorized");
    }
    return await prisma.series.update({
      where: { id },
      data,
    });
  }

  static async softDelete(id, userId) {
    const serie = await prisma.series.findUnique({
      where: { id },

      include: {
        seasons: true,
      },
    });

    if (!serie) {
      throw new Error("Series not found");
    }

    if (serie.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    await prisma.$transaction(async (tx) => {
      // Episodes
      await tx.episode.updateMany({
        where: {
          season: {
            serieId: id,
          },
        },

        data: {
          isActive: false,
        },
      });

      // Seasons
      await tx.season.updateMany({
        where: {
          serieId: id,
        },

        data: {
          isActive: false,
        },
      });

      // Series
      await tx.series.update({
        where: {
          id,
        },

        data: {
          isActive: false,
        },
      });
    });

    return {
      id: serie.id,
      success: true,
    };
  }

  static async rejectSerie(id, adminId) {
    const serie = await prisma.series.findUnique({
      where: { id },
    });

    if (!serie) {
      throw new Error("Series not found");
    }

    await prisma.$transaction(async (tx) => {
      // série
      await tx.series.update({
        where: { id },
        data: {
          isActive: false,
          isPublished: false, // IMPORTANT 👈
        },
      });

      // saisons
      await tx.season.updateMany({
        where: { serieId: id },
        data: {
          isActive: false,
        },
      });

      // épisodes
      await tx.episode.updateMany({
        where: {
          season: {
            serieId: id,
          },
        },
        data: {
          isActive: false,
        },
      });
    });

    return { id, success: true };
  }
  static async publishSerie(id) {
    const serie = await prisma.series.findUnique({
      where: { id },
    });

    if (!serie) {
      throw new Error("Series not found");
    }

    await prisma.series.update({
      where: { id },
      data: {
        isPublished: true,
        isActive: true,
        publishedAt: new Date(),
      },
    });

    return { id, success: true };
  }

  static async hardDelete(id, userId) {
    const serie = await prisma.series.findUnique({
      where: { id },

      include: {
        seasons: {
          include: {
            episodes: true,
          },
        },

        slides: true,
      },
    });

    if (!serie) {
      throw new Error("Series not found");
    }

    if (serie.creatorId !== userId) {
      throw new Error("Unauthorized");
    }

    // =========================
    // DELETE CLOUDINARY SERIES
    // =========================

    if (serie.thumbnailPublicId) {
      await cloudinary_js_config.uploader.destroy(serie.thumbnailPublicId);
    }

    if (serie.trailerPublicId) {
      await cloudinary.uploader.destroy(serie.trailerPublicId, {
        resource_type: "video",
      });
    }

    // =========================
    // DELETE SLIDES
    // =========================

    for (const slide of serie.slides) {
      if (slide.imagePublicId) {
        await cloudinary.uploader.destroy(slide.imagePublicId);
      }

      if (slide.trailerPublicId) {
        await cloudinary.uploader.destroy(slide.trailerPublicId, {
          resource_type: "video",
        });
      }
    }

    // =========================
    // DELETE EPISODES ASSETS
    // =========================

    for (const season of serie.seasons) {
      for (const episode of season.episodes) {
        // video
        if (episode.videoPublicId) {
          await cloudinary.uploader.destroy(episode.videoPublicId, {
            resource_type: "video",
          });
        }

        // thumbnail
        if (episode.thumbnailPublicId) {
          await cloudinary.uploader.destroy(episode.thumbnailPublicId);
        }
      }
    }

    // =========================
    // HARD DELETE DATABASE
    // =========================

    await prisma.series.delete({
      where: {
        id,
      },
    });

    return {
      id: serie.id,
      success: true,
    };
  }

  static async getByCreator(userId) {
    const serie = await prisma.series.findMany({
      where: {
        creatorId: userId, // 🔥 ESSENTIEL pour "My Series"
        isActive: true,
      },
      include: {
        category: true,
        seasons: {
          include: {
            episodes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!serie) {
      throw new Error("Serie not found");
    }
    return serie;
  }

  static async getTopEpisodesByCreator(creatorId, limit = 10) {
    const episodes = await prisma.episode.findMany({
      where: {
        creatorId,
        isPublished: true,
      },
      orderBy: {
        views: "desc",
      },
      take: limit,
    });

    const result = await Promise.all(
      episodes.map(async (episode) => {
        const retention = await prisma.userEpisodeHistory.aggregate({
          where: {
            episodeId: episode.id,
          },
          _avg: {
            progressPercent: true,
          },
        });

        return {
          id: episode.id,
          title: episode.title,
          description: episode.description,
          episodeNumber: episode.episodeNumber,
          duration: `${Math.floor(episode.duration / 60)} min`,
          views: episode.views.toLocaleString(),
          likes: episode.likesCount.toLocaleString(),
          retention: `${Math.round(retention._avg.progressPercent || 0)}%`,
          purchaseCount: episode.purchaseCount,
        };
      }),
    );

    return result;
  }

  static async getSerieByAdminId(userId) {
    const series = await prisma.series.findMany({
      where: {
        creatorId: userId,
      },
      include: {
        category: true,
        seasons: {
          include: {
            episodes: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = await Promise.all(
      series.map(async (serie) => {
        const retention = await prisma.userEpisodeHistory.aggregate({
          where: {
            episode: {
              season: {
                serieId: serie.id,
              },
            },
          },
          _avg: {
            progressPercent: true,
          },
        });

        return {
          ...serie,
          retention: Math.round(retention._avg.progressPercent || 0),
        };
      }),
    );

    return result;
  }
}
module.exports = { SeriesService };
