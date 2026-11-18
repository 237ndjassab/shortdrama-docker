const { faker } = require("@faker-js/faker");
const { prisma } = require("../../src/model/index.js");
const bcrypt = require("bcrypt");

const seedUsers = async () => {
  try {
    // 🔑 récupérer les rôles
    const userRole = await prisma.role.findUnique({
      where: {
        roleKey: "USER",
      },
    });

    const creatorRole = await prisma.role.findUnique({
      where: {
        roleKey: "CREATOR",
      },
    });

    if (!creatorRole || !userRole) {
      throw new Error("Roles USER ou CREATOR introuvables");
    }
    const users = [];
    for (let i = 0; i < 200; i++) {
      users.push({
        name: faker.person.fullName(),
        email: faker.internet.email() + `_${i}`,
        password: faker.internet.password(),
        avatar_url: "/uploads/users/default.png",
        country: faker.location.country(),
        cover_url: faker.image.url(),
        phone: faker.phone.number(),
      });
    }
    let index = 0;
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // 🎯 logique 1 sur 3
      const isCreator = index % 3 === 0;

      const newUser = await prisma.utilisateur.upsert({
        where: {
          email: user.email,
        },
        update: {},
        create: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          avatar_url: user.avatar_url,
          country: user.country,
          cover_url: user.cover_url,
          phone: Number(user.phone),
        },
      });

      // 🔗 assignation du rôle
      await prisma.userHasRole.upsert({
        where: {
          userId_roleId: {
            userId: newUser.id,
            roleId: isCreator ? creatorRole.id : userRole.id,
          },
        },
        update: {},
        create: {
          userId: newUser.id,
          roleId: isCreator ? creatorRole.id : userRole.id,
        },
      });

      // 💰 wallet dynamique
      await prisma.wallet.upsert({
        where: { userId: newUser.id },
        update: {
          balance: isCreator ? 5000 : 0,
          balanceCoins: isCreator ? 1000 : 2000,
        },
        create: {
          userId: newUser.id,
          balance: isCreator ? 5000 : 0,
          balanceCoins: isCreator ? 1000 : 2000,
          totalEarned: 0,
          totalSpent: 0,
        },
      });

      index++;
    }

    console.log("Users seeded avec rôles et wallets ✅");
  } catch (error) {
    console.error("Error seeding system user:", error);
  }
};
module.exports = { seedUsers };
