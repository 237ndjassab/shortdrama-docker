const { prisma } = require("../../src/model/index.js");

const seedPurchases = async () => {
  try {
    console.log("💰 Seeding purchases...");

    // 🔥 récupérer system user
    const systemUser = await prisma.utilisateur.findFirst({
      where: { isSystem: true },
      include: { wallet: true },
    });

    if (!systemUser || !systemUser.wallet) {
      throw new Error("System user not found");
    }

    // 🔥 récupérer utilisateurs NON creators
    const users = await prisma.utilisateur.findMany({
      where: {
        roles: {
          none: {
            role: {
              roleKey: {
                in: ["CREATOR", "ADMIN"],
              },
            },
          },
        },
      },
      include: { wallet: true },
    });

    // 🔥 récupérer épisodes payants
    const episodes = await prisma.episode.findMany({
      where: {
        priceCoins: { gt: 0 },
      },
      include: {
        creator: {
          include: { wallet: true },
        },
      },
    });

    const coinToCashRate = 10;
    const COMMISSION_PERCENT = 10;

    for (const user of users) {
      // 🎯 chaque user achète 2 à 5 épisodes
      const purchaseCount = Math.floor(Math.random() * 4) + 2;

      const shuffledEpisodes = [...episodes].sort(() => 0.5 - Math.random());

      let count = 0;

      for (const episode of shuffledEpisodes) {
        if (count >= purchaseCount) break;

        // ❌ éviter acheter son propre épisode
        if (episode.creatorId === user.id) continue;

        const buyerWallet = user.wallet;
        const creatorWallet = episode.creator.wallet;

        if (!buyerWallet || !creatorWallet) continue;

        // ❌ pas assez de coins
        if (buyerWallet.balanceCoins < episode.priceCoins) continue;

        // ❌ déjà acheté
        const alreadyBought = await prisma.purchase.findUnique({
          where: {
            userId_episodeId: {
              userId: user.id,
              episodeId: episode.id,
            },
          },
        });

        if (alreadyBought) continue;

        await prisma.$transaction(async (tx) => {
          // 💸 debit buyer
          await tx.wallet.update({
            where: { id: buyerWallet.id },
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

          // 💰 calcul commission
          const commissionCoins = Math.floor(
            (episode.priceCoins * COMMISSION_PERCENT) / 100,
          );

          const commissionCash = commissionCoins * coinToCashRate;

          const creatorGainCoins = episode.priceCoins - commissionCoins;

          const creatorGainCash = creatorGainCoins * coinToCashRate;

          // 💰 credit creator
          await tx.wallet.update({
            where: { id: creatorWallet.id },
            data: {
              balance: {
                increment: creatorGainCash,
              },
              totalEarned: {
                increment: creatorGainCash,
              },
              lastTransactionAt: new Date(),
            },
          });

          // 💰 credit plateforme
          await tx.wallet.update({
            where: { id: systemUser.wallet.id },
            data: {
              balance: {
                increment: commissionCash,
              },
              totalEarned: {
                increment: commissionCash,
              },
              lastTransactionAt: new Date(),
            },
          });

          // 🧾 transaction buyer
          await tx.transaction.create({
            data: {
              walletId: buyerWallet.id,
              amount: episode.priceCoins,
              type: "DEBIT",
              source: "PURCHASE",
              balanceCoinsBefore: buyerWallet.balanceCoins,
              balanceCoinsAfter: buyerWallet.balanceCoins - episode.priceCoins,
              episodeId: episode.id,
            },
          });

          // 🧾 transaction creator
          await tx.transaction.create({
            data: {
              walletId: creatorWallet.id,
              amount: creatorGainCash,
              type: "CREDIT",
              source: "SELL_EPISODE",
              balanceCashBefore: creatorWallet.balance,
              balanceCashAfter: (creatorWallet.balance || 0) + creatorGainCash,
              episodeId: episode.id,
            },
          });

          // 🧾 transaction system
          await tx.transaction.create({
            data: {
              walletId: systemUser.wallet.id,
              amount: commissionCash,
              type: "CREDIT",
              source: "COMMISSION",
              balanceCashBefore: systemUser.wallet.balance,
              balanceCashAfter:
                (systemUser.wallet.balance || 0) + commissionCash,
              episodeId: episode.id,
            },
          });

          // 🛒 purchase
          await tx.purchase.create({
            data: {
              userId: user.id,
              episodeId: episode.id,
            },
          });
        });

        // 🔄 mettre à jour wallet local (important sinon bug)
        user.wallet.balanceCoins -= episode.priceCoins;

        count++;
      }
    }

    console.log("✅ Purchases seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding purchases:", error);
  }
};

module.exports = { seedPurchases };
