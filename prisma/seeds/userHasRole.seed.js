const { prisma } = require("../../src/model/index.js");

const seedUserHasRole = async () => {
  console.log("Seeding use_has_role 🔃");
  const adminUser = await prisma.utilisateur.findFirst({
    where: {
      email: "admin@test.com",
    },
  });
  const normalUser = await prisma.utilisateur.findFirst({
    where: {
      email: "user@test.com",
    },
  });
  const viewerUser = await prisma.utilisateur.findFirst({
    where: {
      email: "viewer@test.com",
    },
  });
  const creatorUser = await prisma.utilisateur.findFirst({
    where: {
      email: "creator@test.com",
    },
  });
  const adminRole = await prisma.role.findFirst({
    where: {
      roleKey: "ADMIN",
    },
  });

  const userRole = await prisma.role.findFirst({
    where: {
      roleKey: "USER",
    },
  });

  const creatorRole = await prisma.role.findFirst({
    where: {
      roleKey: "CREATOR",
    },
  });

  const viewerRole = await prisma.role.findFirst({
    where: {
      roleKey: "VIEWER",
    },
  });

  const relations = [
    {
      user: adminUser,
      role: adminRole,
    },
    {
      user: normalUser,
      role: userRole,
    },
    {
      user: viewerUser,
      role: viewerRole,
    },
    {
      user: creatorUser,
      role: creatorRole,
    },
  ];
  for (const relation of relations) {
    const existingRelation = await prisma.userHasRole.findFirst({
      where: {
        userId: relation.user.id,
        roleId: relation.role.id,
      },
    });
    if (!existingRelation) {
      await prisma.userHasRole.create({
        data: {
          userId: relation.user.id,
          roleId: relation.role.id,
        },
      });
    }
  }
  console.log("UserHasRole seeded 👌");
};

module.exports = { seedUserHasRole };
