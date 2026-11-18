const { prisma } = require("../model/index.js");

class CoinPackService {
  static async create(data) {
    const { name, coins, price, image, isActive, isPopular } = data;
    if (!name || !coins || !price || !image) {
      throw new Error("Missing Field");
    }
    return await prisma.coinPack.create({
      data: {
        name,
        coins: +coins,
        price: +price,
        image,
        isActive: isActive === true || isActive === "true",
        isPopular: isPopular === true || isPopular === "true",
      },
    });
  }
  static async getAll(isAdmin = false) {
    return await prisma.coinPack.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async update(id, data) {
    const { name, coins, price, image, isActive, isPopular } = data;
    if (!id) {
      throw new Error("Missing ID");
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data provided for update");
    }

    // Vérifier si le pack existe
    const existing = await prisma.coinPack.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`CoinPack with id ${id} not found`);
    }

    return await prisma.coinPack.update({
      where: { id },
      data: {
        name,
        coins: +coins,
        price: +price,
        image,
        isActive: isActive === true || isActive === "true",
        isPopular: isPopular === true || isPopular === "true",
      },
    });
  }

  static async delete(id) {
    if (!id) {
      throw new Error("Field missing");
    }
    return await prisma.coinPack.delete({
      where: {
        id,
      },
    });
  }

  static async setActive(id) {
    if (!id) {
      throw new Error("Field missing");
    }
    return await prisma.coinPack.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
    });
  }

  static async setInactive(id) {
    if (!id) {
      throw new Error("Field missing");
    }
    return await prisma.coinPack.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }
}

module.exports = { CoinPackService };
