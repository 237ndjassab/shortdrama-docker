const { prisma } = require("../../src/model/index.js");

const seedRoleHasPermissions = async () => {
  console.log("Seeding role_has_permission ...🎶");
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

  const permissions = await prisma.permission.findMany();

  if (!adminRole) throw new Error("ADMIN role not found");
  if (!userRole) throw new Error("USER role not found");
  if (!viewerRole) throw new Error("VIEWER role not found");
  if (!creatorRole) throw new Error("CREATOR role not found");

  /*
  ADMIN -> toutes les permissions |\
  */

  for (const permission of permissions) {
    const existingRelation = await prisma.roleHasPermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
    });

    if (!existingRelation) {
      await prisma.roleHasPermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  //   ici ce sont les permissions accordes a l\'utilisateur standard celui qui est deja connecte

  const buyPermission = permissions.find(
    (p) => p.permissionKey === "EPISODE:BUY",
  );

  if (buyPermission) {
    const existingRelation = await prisma.roleHasPermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: buyPermission.id,
        },
      },
    });
    if (!existingRelation) {
      await prisma.roleHasPermission.create({
        data: {
          roleId: userRole.id,
          permissionId: buyPermission.id,
        },
      });
    }
  }

  //   ici ce sont les permissions accordées aux createurs de contenu

  const creatorPermissions = permissions.filter(
    (p) =>
      p.permissionKey === "SERIES:CREATE" ||
      p.permissionKey === "SERIES:UPDATE" ||
      p.permissionKey === "SERIES:DELETE" ||
      p.permissionKey === "SERIES:ME" ||
      p.permissionKey === "EPISODE:DELETE" ||
      p.permissionKey === "EPISODE:UPDATE" ||
      p.permissionKey === "EPISODE:BUY" ||
      p.permissionKey === "EPISODE:CREATE" ||
      p.permissionKey === "CREATOR:WITHDRAW" ||
      p.permissionKey === "EPISODE:VIEW_PURCHASES" ||
      p.permissionKey === "SEASON:CREATE" ||
      p.permissionKey === "SEASON:UPDATE" ||
      p.permissionKey === "SEASON:DELETE"
  );
  for (const permission of creatorPermissions) {
    const exisistingRelation = await prisma.roleHasPermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: creatorRole.id,
          permissionId: permission.id,
        },
      },
    });

    if (!exisistingRelation) {
      await prisma.roleHasPermission.create({
        data: {
          roleId: creatorRole.id,
          permissionId: permission.id,
        },
      });
    }
  }
  console.log("RoleHasPermission seeded 👌");
};

module.exports = { seedRoleHasPermissions };
