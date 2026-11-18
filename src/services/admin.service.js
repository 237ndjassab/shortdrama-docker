const { ApiReponse } = require("../helpers/response.js");
const { prisma } = require("../model/index.js");
const cloudinary = require("../config/cloudinary.config.js");
const { responseMetrics } = require("../middleware/responseTime.middleware.js");

class AdminService {
  static async getDashboardStats() {
    const [
      totalUsers,
      totalEpisodes,
      totalPurchases,
      totalDeposits,
      totalWithdraws,
      totalSpent,
      totalEarned,
    ] = await Promise.all([
      prisma.utilisateur.count(),
      prisma.episode.count(),
      prisma.purchase.count(),
      prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          source: "DEPOSIT",
        },
      }),
      prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          source: "WITHDRAW",
        },
      }),
      prisma.wallet.aggregate({
        _sum: {
          totalSpent: true,
        },
      }),
      prisma.wallet.aggregate({
        _sum: {
          totalEarned: true,
        },
      }),
    ]);
    return {
      users: totalUsers,
      episodes: totalEpisodes,
      purchases: totalPurchases,
      finance: {
        deposits: totalDeposits._sum.amount || 0,
        witdrawals: totalWithdraws._sum.amount || 0,
        totalSpent: totalSpent._sum.totalSpent || 0,
        totalEarned: totalEarned._sum.totalEarned || 0,
      },
    };
  }

  static async getMonthlyRevenue() {
    const transactions = await prisma.transaction.findMany({
      where: {
        source: "SELL_EPISODE",
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });
    const monthlyRevenue = {};
    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyRevenue[key]) {
        monthlyRevenue[key] = 0;
      }
      monthlyRevenue[key] += Number(tx.amount);
    });
    return monthlyRevenue;
  }

  static async getTopContent(period = "week") {
    const now = new Date();

    let startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;

      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;

      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;

      default:
        startDate.setDate(now.getDate() - 7);
    }

    const result = await prisma.purchase.groupBy({
      by: ["episodeId"],

      where: {
        createdAt: {
          gte: startDate,
        },
      },

      _count: {
        episodeId: true,
      },

      orderBy: {
        _count: {
          episodeId: "desc",
        },
      },

      take: 10,
    });

    const episodeIds = result.map((item) => item.episodeId);

    const episodes = await prisma.episode.findMany({
      where: {
        id: {
          in: episodeIds,
        },
      },

      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
          },
        },
        season: {
          select: {
            serie: {
              select: {
                title: true,
              },
            },
          },
        },
        transactions: {
          where: {
            source: "PURCHASE",
          },
          select: {
            amount: true,
          },
        },
      },
    });

    return result.map((item) => {
      const episode = episodes.find((e) => e.id === item.episodeId);
      const totalAmount = episode.transactions.reduce(
        (acc, t) => acc + Number(t.amount),
        0,
      );

      return {
        ...episode,
        totalSales: item._count.episodeId,
        totalAmount: totalAmount,
      };
    });
  }
  static async getTopCreateur(period = "month") {
    const now = new Date();

    let startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;

      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;

      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;

      default:
        startDate.setDate(now.getDate() - 7);
    }

    const result = await prisma.purchase.groupBy({
      by: ["episodeId"],

      where: {
        createdAt: {
          gte: startDate,
        },
      },

      _count: {
        episodeId: true,
      },

      orderBy: {
        _count: {
          episodeId: "desc",
        },
      },

      take: 10,
    });

    const episodeIds = result.map((item) => item.episodeId);

    const episodes = await prisma.episode.findMany({
      where: {
        id: {
          in: episodeIds,
        },
      },

      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            series: true,
          },
        },
        season: {
          include: {
            serie: true,
          },
        },
        transactions: {
          where: {
            source: "SELL_EPISODE",
          },
          select: {
            amount: true,
          },
        },
      },
    });

    const creatorsMap = {};

    episodes.forEach((episode) => {
      const creatorId = episode.creator.id;

      const revenue = episode.transactions.reduce(
        (acc, t) => acc + Number(t.amount),
        0,
      );

      if (!creatorsMap[creatorId]) {
        creatorsMap[creatorId] = {
          creator: episode.creator,
          totalAmount: 0,
          totalSales: 0,
          totalSeries: episode.creator.series.length,
        };
      }

      creatorsMap[creatorId].totalAmount += revenue;
      creatorsMap[creatorId].totalSales += episode.purchaseCount;
    });

    return Object.values(creatorsMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }

  static async getUsersByDay() {
    const now = new Date();

    let todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const current = await prisma.utilisateur.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const previous = await prisma.utilisateur.count({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
    });

    const userVariation =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : Number((((current - previous) / previous) * 100).toFixed(1));

    return {
      current,
      userVariation,
    };
  }
  static async getTotalViewsForAdmin(adminId) {
    const now = new Date();

    let currentStart = new Date();
    currentStart.setHours(0, 0, 0, 0);

    let previousStart = new Date();
    previousStart.setDate(now.getDate() - 1);

    const [currentViews, previousViews] = await Promise.all([
      prisma.userEpisodeHistory.count({
        where: {
          episode: {
            creatorId: adminId,
          },
          firstWatchedAt: {
            gte: currentStart,
          },
        },
      }),

      prisma.userEpisodeHistory.count({
        where: {
          episode: {
            creatorId: adminId,
          },
          firstWatchedAt: {
            gte: previousStart,
            lt: currentStart,
          },
        },
      }),
    ]);

    const totalViews = await prisma.creatorStats.findUnique({
      where: {
        userId: adminId,
      },
      select: {
        totalViews: true,
      },
    });

    const evolution =
      previousViews === 0
        ? 100
        : ((currentViews - previousViews) / previousViews) * 100;

    return {
      totalViews: totalViews?.totalViews || 0,
      evolution: Number(evolution.toFixed(1)),
    };
  }
  static async getEstimatedRevenueForAdmin(adminId) {
    const now = new Date();

    let currentPeriodStart = new Date();
    currentPeriodStart.setDate(now.getDate() - 30);

    let previousPeriodStart = new Date();
    previousPeriodStart.setDate(now.getDate() - 60);

    const [totalRevenue, currentRevenue, previousRevenue] = await Promise.all([
      prisma.episodeRevenue.aggregate({
        where: {
          creatorId: adminId,
        },
        _sum: {
          creatorAmount: true,
        },
      }),

      prisma.episodeRevenue.aggregate({
        where: {
          creatorId: adminId,
          createdAt: {
            gte: currentPeriodStart,
          },
        },
        _sum: {
          creatorAmount: true,
        },
      }),

      prisma.episodeRevenue.aggregate({
        where: {
          creatorId: adminId,
          createdAt: {
            gte: previousPeriodStart,
            lt: currentPeriodStart,
          },
        },
        _sum: {
          creatorAmount: true,
        },
      }),
    ]);

    const total = Number(totalRevenue._sum.creatorAmount || 0);
    const current = Number(currentRevenue._sum.creatorAmount || 0);
    const previous = Number(previousRevenue._sum.creatorAmount || 0);

    let evolution = 0;

    if (previous > 0) {
      evolution = ((current - previous) / previous) * 100;
    } else if (current > 0) {
      evolution = 100;
    }

    return {
      totalRevenue: total,
      evolution: Number(evolution.toFixed(1)),
    };
  }

  static calculateEvolution(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(1));
  }
  static async getPlatformGrossRevenueKpi() {
    const now = new Date();

    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(now.getDate() - 30);

    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(now.getDate() - 60);

    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.episodeRevenue.aggregate({
        where: {
          createdAt: {
            gte: currentPeriodStart,
          },
        },
        _sum: {
          commissionAmount: true,
        },
      }),

      prisma.episodeRevenue.aggregate({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: currentPeriodStart,
          },
        },
        _sum: {
          commissionAmount: true,
        },
      }),
    ]);

    const current = Number(currentRevenue._sum.commissionAmount || 0);

    const previous = Number(previousRevenue._sum.commissionAmount || 0);

    return {
      amount: current,
      evolution: this.calculateEvolution(current, previous),
    };
  }
  static async getSuccessfulTransactionsKpi() {
    const now = new Date();

    const currentWeek = new Date();
    currentWeek.setDate(now.getDate() - 7);

    const previousWeek = new Date();
    previousWeek.setDate(now.getDate() - 14);

    const [current, previous, total] = await Promise.all([
      prisma.payment.count({
        where: {
          status: "SUCCESS",
          createdAt: {
            gte: currentWeek,
          },
        },
      }),

      prisma.payment.count({
        where: {
          status: "SUCCESS",
          createdAt: {
            gte: previousWeek,
            lt: currentWeek,
          },
        },
      }),

      prisma.payment.count({
        where: {
          status: "SUCCESS",
        },
      }),
    ]);

    return {
      total,
      evolution: this.calculateEvolution(current, previous),
    };
  }
  static async getCoinsInCirculation() {
    const result = await prisma.wallet.aggregate({
      _sum: {
        balanceCoins: true,
      },
    });

    return {
      totalCoins: result._sum.balanceCoins || 0,
    };
  }
  static async getPendingPaymentsKpi() {
    const now = new Date();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const beforeYesterday = new Date();
    beforeYesterday.setDate(now.getDate() - 2);

    const [pendingAmount, current, previous] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: "PENDING",
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          status: "PENDING",
          createdAt: {
            gte: yesterday,
          },
        },
        _count: true,
      }),

      prisma.payment.aggregate({
        where: {
          status: "PENDING",
          createdAt: {
            gte: beforeYesterday,
            lt: yesterday,
          },
        },
        _count: true,
      }),
    ]);

    return {
      amount: Number(pendingAmount._sum.amount || 0),
      evolution: this.calculateEvolution(current._count, previous._count),
    };
  }
  static async getCoinsByMonth() {
    const now = new Date();

    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    let lastMonthStart = new Date(startDate);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const currentResult = await prisma.transaction.aggregate({
      where: {
        source: "COIN_PURCHASE",
        createdAt: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const previousResult = await prisma.transaction.aggregate({
      where: {
        source: "COIN_PURCHASE",
        createdAt: {
          gte: lastMonthStart,
          lt: startDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const current = currentResult._sum.amount?.toNumber() ?? 0;

    const previous = previousResult._sum.amount?.toNumber() ?? 0;

    const coinVariation =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : Number((((current - previous) / previous) * 100).toFixed(1));

    return {
      current,
      coinVariation,
    };
  }

  static async getEpisodesViewedLast24Hours() {
    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    let yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const current = await prisma.userEpisodeHistory.count({
      where: {
        lastWatchedAt: {
          gte: startDate,
        },
      },
    });
    const previous = await prisma.userEpisodeHistory.count({
      where: {
        lastWatchedAt: {
          gte: yesterdayStart,
          lt: startDate,
        },
      },
    });

    const viewsVariation =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : Number((((current - previous) / previous) * 100).toFixed(1));
    return {
      current,
      viewsVariation,
    };
  }
  static async getTransactions() {
    return await prisma.transaction.findMany({
      where: {
        source: "PURCHASE",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },

        episode: {
          include: {
            season: {
              include: {
                serie: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
  static async getCloudinaryStorage() {
    const result = await cloudinary.api.usage();

    const storageUsed = result.storage?.usage ?? 0;
    const storageLimit = result.storage?.limit ?? null;

    const usedGB = Number((storageUsed / 1024 / 1024 / 1024).toFixed(2));

    const limitGB =
      storageLimit !== null
        ? Number((storageLimit / 1024 / 1024 / 1024).toFixed(2))
        : null;

    const percentageUsed =
      storageLimit && storageLimit > 0
        ? Number(((storageUsed / storageLimit) * 100).toFixed(1))
        : null;

    return {
      usedGB,
      limitGB,
      percentageUsed,
    };
  }
  static async getAverageResponseTime() {
    const durations = responseMetrics.durations;

    if (!durations.length) {
      return 0;
    }

    const total = durations.reduce((sum, duration) => sum + duration, 0);

    return Math.round(total / durations.length);
  }
  static async getPaymentConversionRate() {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const totalPayments = await prisma.payment.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    const successPayments = await prisma.payment.count({
      where: {
        status: "SUCCESS",
        createdAt: {
          gte: startDate,
        },
      },
    });

    const percentage =
      totalPayments === 0
        ? 0
        : Number(((successPayments / totalPayments) * 100).toFixed(1));

    return {
      totalPayments,
      successPayments,
      percentage,
    };
  }

  static async getPlateformEarning() {
    const isPlateform = await prisma.utilisateur.findFirst({
      where: {
        isSystem: true,
      },
      select: {
        wallet: {
          select: {
            balance: true,
          },
        },
      },
    });
    return isPlateform ? isPlateform.wallet.balance : 0;
  }

  static async getTopCoinsPack() {
    return await prisma.coinPack.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        purchaseCount: "desc",
        take: 5,
      },
    });
  }
}
module.exports = { AdminService };
