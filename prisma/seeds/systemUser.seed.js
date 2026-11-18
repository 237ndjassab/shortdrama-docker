const { prisma } = require("../../src/model/index.js");
const bcrypt = require("bcrypt");

const seedSystemUser = async () => {
  try {
    console.log("Seeding system user...");

    const email = "system@shortdrama.africa";
    const hashedPassword = await bcrypt.hash("syst3mP@ssw0rd", 10);

    const systemUser = await prisma.utilisateur.upsert({
      where: { email },
      update: {},
      create: {
        name: "System",
        email,
        password: hashedPassword,
        avatar_url: "/uploads/users/default.png",
        isSystem: true,
      },
    });

    await prisma.wallet.upsert({
      where: { userId: systemUser.id },
      update: {},
      create: {
        userId: systemUser.id,
        balance: 0,
        balanceCoins: 0,
        totalEarned: 0,
        totalSpent: 0,
      },
    });

    console.log("System user ready ✅");
  } catch (error) {
    console.error("Error seeding system user:", error);
  }
};

module.exports = { seedSystemUser };