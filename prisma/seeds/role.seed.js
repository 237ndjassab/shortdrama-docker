const { prisma } = require("../../src/model/index.js");

const rolesSeed = [
  {
    name: "Administrateur",
    roleKey: "ADMIN",
    description: "Acces total a la plateforme",
  },
  {
    name: "Visiteur",
    roleKey: "VIEWER",
    description: "Visiteur de l'application",
  },
  {
    name: "Utilisateur",
    roleKey: "USER",
    description: "Utilisateur standard",
  },
  {
    name: "Createur",
    roleKey: "CREATOR",
    description: "Utilisateur capable de creer du contenu",
  },
];

const seedRoles = async () => {
  console.log("Seeding roles ...");
  for (const role of rolesSeed) {
    const existingRole = await prisma.role.findFirst({
      where: {
        name: role.name,
      },
    });

    if (existingRole) {
      await prisma.role.update({
        where: {
          id: existingRole.id,
        },
        data: role,
      });
    } else {
      await prisma.role.create({
        data: role,
      });
    }
  }
  console.log("Roles seeded ✅");
};

module.exports = { seedRoles };
