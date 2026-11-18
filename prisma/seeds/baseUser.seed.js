const { prisma } = require("../../src/model/index.js");
const bcrypt = require("bcrypt");

const userSeed = [
  {
    name: "Super Admin",
    email: "admin@test.com",
    passwordEnv: "SEED_ADMIN_PASSWORD",
    avatar_url: "/uploads/users/default.png",
  },
  {
    name: "Platform",
    email: "platform@test.com",
    passwordEnv: "SEED_PLATFORM_PASSWORD",
    avatar_url: "/uploads/users/default.png",
  },
  {
    name: "Premier Utilisateur",
    email: "user@test.com",
    passwordEnv: "SEED_USER_PASSWORD",
    avatar_url: "/uploads/users/default.png",
  },
  {
    name: "Premier Viewer",
    email: "viewer@test.com",
    passwordEnv: "SEED_VIEWER_PASSWORD",
    avatar_url: "/uploads/users/default.png",
  },
  {
    name: "Premier Createur",
    email: "creator@test.com",
    passwordEnv: "SEED_CREATOR_PASSWORD",
    avatar_url: "/uploads/users/default.png",
  },
];

const seedBaseUsers = async () => {
  console.log("Seeding users...");

  // Vérifier toutes les variables avant de modifier la base.
  const missingVariables = userSeed
    .filter((user) => !process.env[user.passwordEnv])
    .map((user) => user.passwordEnv);

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing seed environment variables: ${missingVariables.join(", ")}`
    );
  }

  for (const user of userSeed) {
    const { passwordEnv, ...userData } = user;

    const hashedPassword = await bcrypt.hash(
      process.env[passwordEnv],
      10
    );

    const savedUser = await prisma.utilisateur.upsert({
      where: {
        email: userData.email,
      },
      update: {
        ...userData,
        password: hashedPassword,
      },
      create: {
        ...userData,
        password: hashedPassword,
      },
    });

    await prisma.wallet.upsert({
      where: {
        userId: savedUser.id,
      },
      update: {},
      create: {
        userId: savedUser.id,
        balance: 0,
        balanceCoins: 0,
        totalEarned: 0,
        totalSpent: 0,
      },
    });
  }

  console.log("Users seeded ✅");
};

module.exports = { seedBaseUsers };
