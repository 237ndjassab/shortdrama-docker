const { Prisma } = require("@prisma/client");
const { prisma } = require("../model/index.js");

class WalletService {
  //cette fonction est ecrite pour crediter le wallet de l'utilisateur de facon manuelle
  static async deposit(userId, amount) {
    if (!amount || amount <= 0) {
      throw new Error("Invalid deposit amount");
    }
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });
      if (!wallet) {
        throw new Error("Wallet not found");
      }
      const balanceCoinsBefore = wallet.balanceCoins;
      const balanceCoinsAfter = new Prisma.Decimal(balanceCoinsBefore).plus(
        amount,
      );

      //update le wallet
      await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balanceCoins: {
            increment: amount,
          },
          lastTransactionAt: new Date(),
        },
      });

      //creation de la transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(amount),
          type: "CREDIT",
          source: "DEPOSIT",
          balanceCoinsBefore,
          balanceCoinsAfter,
        },
      });

      return {
        balanceCoinsBefore: balanceCoinsBefore.toString(),
        balanceCoinsAfter: balanceCoinsAfter.toString(),
      };
    });
  }

  static async buyCoins(userId, packId) {
    if (env.node_env === "production") {
      throw new Error("Disabled in production");
    }
    return prisma.$transaction(async (tx) => {
      const pack = await tx.coinPack.findUnique({
        where: {
          id: packId,
        },
      });
      if (!pack || !pack.isActive) {
        throw new Error("Pack Not Available");
      }
      const wallet = await tx.wallet.findUnique({
        where: {
          userId: userId,
        },
      });
      if (!wallet) {
        throw new Error("wallet not found");
      }
      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balanceCoins: {
            increment: pack.coins,
          },
        },
      });
      await tx.coinPack.update({
        where: {
          id: packId,
        },
        data: {
          purchaseCount: {
            increment: 1,
          },
        },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: pack.coins,
          price: pack.price,
          type: "CREDIT",
          source: "COIN_PURCHASE",
          balanceCoinsBefore: wallet.balanceCoins,
          balanceCoinsAfter: updatedWallet.balanceCoins,
        },
      });
      return {
        coinsAdded: pack.coins,
        newBalance: updatedWallet.balanceCoins,
        pack: {
          id: pack.id,
          coins: pack.coins,
          price: pack.price,
        },
      };
    });
  }

  static async withdraw(userId, amount) {
    if (!amount || amount <= 0) {
      throw new Error("Invalid withdraw amount");
    }
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          userId,
        },
      });
      if (!wallet) {
        throw new Error("Wallet not found");
      }
      if (wallet.balanceCoins < amount) {
        throw new Error("Insufficient balance");
      }
      const balanceCashBefore = wallet.balance;
      const balanceCashAfter = new Prisma.Decimal(balanceCashBefore).minus(
        amount,
      );

      //update wallet
      await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            decrement: amount,
          },
          totalSpent: {
            increment: amount,
          },
          lastTransactionAt: new Date(),
        },
      });

      //create transactions
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(amount),
          type: "DEBIT",
          source: "WITHDRAW",
          balanceCashBefore,
          balanceCashAfter,
        },
      });

      return {
        balanceCashAfter: balanceCashAfter.toString(),
        balanceCashBefore: balanceCashBefore.toString(),
      };
    });
  }

  static async getMyWallet(userId) {
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: {
        balance: true,
        balanceCoins: true,
        totalSpent: true,
        totalEarned: true,
        createdAt: true,
        lastTransactionAt: true,
      },
    });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return {
      balance: wallet.balance.toString(),
      totalSpent: wallet.totalSpent.toString(),
      totalEarned: wallet.totalEarned.toString(),
      balanceCoins: wallet.balanceCoins.toString(),
      lastTransactionAt: wallet.lastTransactionAt,
      createdAt: wallet.createdAt,
    };
  }

  static async getWalletTransaction(userId, query) {
    const { page = 1, limit = 10, type } = query;
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId,
      },
    });
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    const skip = (Number(page) - 1) * Number(limit);
    const whereCondition = {
      walletId: wallet.id,
    };
    if (type) {
      whereCondition.type = type;
    }
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: Number(limit),
      }),
      prisma.transaction.count({
        where: whereCondition,
      }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getWalletByUserId(userId) {
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId: userId,
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
        transaction: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10, //on prend les 10 dernieres transactions
        },
      },
    });
    if (!wallet) {
      throw new Error("wallet not found");
    }
    return wallet;
  }
}

module.exports = { WalletService };
