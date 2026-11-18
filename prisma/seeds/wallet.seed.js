const { prisma } = require("../../src/model/index.js");

const walletSeed = async () => {
  console.log("Seeding wallets ... ");
  const users = await prisma.utilisateur.findMany({
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
  for (const user of users) {
    const roleKeys = user.roles.map((ur) => ur.role.roleKey);
    const hasUserOrCreator =
      roleKeys.includes("USER") || roleKeys.includes("CREATOR");
    if (!hasUserOrCreator) continue;
    let initialBalance = 0;
    let initialBalanceCash = 0;
    if (roleKeys.includes("CREATOR")) {
      initialBalance = 100;
      initialBalanceCash = 1500;
    } else if (roleKeys.includes("USER")) {
      initialBalance = 50;
    }
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        userId: user.id,
      },
    });
    if (!existingWallet) {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: initialBalanceCash,
          balanceCoins: initialBalance,
          totalEarned: 0,
          totalSpent: 0,
        },
      });
      console.log(`wallet created for user : ${user.name} `);
    }
  }
  console.log("Wallet seeding completed ");
};

module.exports = { walletSeed };
