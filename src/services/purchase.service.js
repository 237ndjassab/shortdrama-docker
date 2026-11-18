const { prisma } = require("../model/index.js");

class PurchaseService {
  static async getMyPurchases(userId) {
    const purchase = await prisma.purchase.findMany({
      where: {
        userId: userId,
      },
      include: {
        episode: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            createdAt: true,
            creator: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return purchase;
  }

  static async getEpisodePurchases(episodeId) {
    const purchases = await prisma.purchase.findMany({
      where: {
        episodeId: episodeId,
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });
    return purchases;
  }
}
module.exports = { PurchaseService };
