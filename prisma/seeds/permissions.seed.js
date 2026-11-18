const { prisma } = require("../../src/model/index.js");

const permissionsSeed = [
  {
    name: "get all categories",
    permissionKey: "CATEGORY:GETALL",
    description: "Permet de voir toutes les categories creer",
  },
  {
    name: "create a category",
    permissionKey: "CATEGORY:CREATE",
    description: "Permet de creer une nouvelle categorie",
  },
  {
    name: "update a category",
    permissionKey: "CATEGORY:UPDATE",
    description: "Permet de modifier une categorie",
  },
  {
    name: "delete a category",
    permissionKey: "CATEGORY:DELETE",
    description: "Permet de supprimer une categorie",
  },
  {
    name: "Creer une serie",
    permissionKey: "SERIES:CREATE",
    description: "Permet de creer une serie",
  },
  {
    name: "modifier une serie",
    permissionKey: "SERIES:UPDATE",
    description: "Permet de modifier une serie",
  },
  {
    name: "delete une serie",
    permissionKey: "SERIES:DELETE",
    description: "Permet de supprimer une serie",
  },
  {
    name: "hard delete une serie",
    permissionKey: "SERIES:HARD_DELETE",
    description: "Permet de supprimer une serie definitivement",
  },
  {
    name: "get/me",
    permissionKey: "SERIES:ME",
    description: "Permet a un createur de voir ses series",
  },
  {
    name: "creer un episode",
    permissionKey: "EPISODE:CREATE",
    description: "Permet de creer un nouvel episode episode",
  },
  {
    name: "Supprimer un episode",
    permissionKey: "EPISODE:DELETE",
    description: "Permet de supprimer un episode",
  },
  {
    name: "Modifier un episode",
    permissionKey: "EPISODE:UPDATE",
    description: "Permet de modifier un episode",
  },
  {
    name: "Acheter un episode",
    permissionKey: "EPISODE:BUY",
    description: "Permet d'acheter un epsiode",
  },
  {
    name: "liste des episodes achetés",
    permissionKey: "EPISODE:VIEW_PURCHASES_FOR_USER",
    description: "Permet de voir la liste des episodes achetés",
  },
  {
    name: "Ajouter un utilisateur",
    permissionKey: "USERS:ADD",
    description: "permet de creer un nouvel utilisateur",
  },
  {
    name: "Suspendre un utilisateur",
    permissionKey: "USERS:BLOC",
    description: "permet de suspendre un compte utilisateur",
  },
  {
    name: "restaurer un utilisateur",
    permissionKey: "USERS:RESTAURE",
    description: "permet de restaurer un compte utilisateur",
  },
  {
    name: "Suprimer un utilisateur",
    permissionKey: "USERS:DELETE",
    description: "permet de Suprimer un compte utilisateur",
  },
  {
    name: "modifier un utilisateur",
    permissionKey: "USERS:UPDATE",
    description: "permet de modifier un compte utilisateur",
  },
  {
    name: "voir la liste des utilisateurs",
    permissionKey: "USERS:VIEW",
    description: "permet de voir la liste des comptes utilisateurs",
  },
  {
    name: "assigner des roles a des utilisateurs",
    permissionKey: "USERS:ASSIGN_ROLE",
    description: "permet d'assigner des roles a un compte utilisateur",
  },
  {
    name: "authorisation pour l'administrateur",
    permissionKey: "ADMIN:DASHBOARD",
    description:
      "authorisation pour effectuer les requettes quantitative du dashboard",
  },
  {
    name: "authorisation pour l'administrateur",
    permissionKey: "WALLET:VIEW",
    description:
      "authorisation pour voir le wallet d'un utilisateur",
  },
  {
    name: "authorisation pour gerer les packs de coins",
    permissionKey: "ADMIN:COIN_PACK",
    description:
      "authorisation pour gerer la liste des packs de coins deja crée",
  },
  {
    name: "retirer de l'argent de son compte",
    permissionKey: "CREATOR:WITHDRAW",
    description: "permissions pour retirer de l'argent de son compte",
  },
  {
    name: "liste de users qui ont achetés l'episode",
    permissionKey: "EPISODE:VIEW_PURCHASES",
    description:
      "permet pour un admin ou un createur de voir la liste de users qui ont achetés l'episode",
  },
  {
    name: "create season",
    permissionKey: "SEASON:CREATE",
    description:
      "permet pour un admin ou un createur de creer une nouvelle saison",
  },
  {
    name: "update season",
    permissionKey: "SEASON:UPDATE",
    description:
      "permet pour un admin ou un createur de modifier une saison",
  },
  {
    name: "delete season",
    permissionKey: "SEASON:DELETE",
    description:
      "permet pour un admin ou un createur de supprimer une saison",
  },
];

const seedPermissions = async () => {
  console.log("Seeding permissions");
  for (const permission of permissionsSeed) {
    const existingPermission = await prisma.permission.findFirst({
      where: {
        permissionKey: permission.permissionKey,
      },
    });
    if (existingPermission) {
      await prisma.permission.update({
        where: {
          id: existingPermission.id,
        },
        data: permission,
      });
    } else {
      await prisma.permission.create({
        data: permission,
      });
    }
  }
  console.log("Permissions seeded 👍");
};

module.exports = {
  seedPermissions,
};
