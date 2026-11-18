const { ApiReponse } = require("../helpers/response.js");
const { Utils } = require("../helpers/Utils.js");
const { prisma } = require("../model/index.js");
const bcrypt = require("bcrypt");
const { UserService } = require("../services/user.service.js");

/**

* ============================================================
* 📌 GET /users (Paginated + Filters)
* ============================================================
*
* 🎯 OBJECTIF :
* Récupérer une liste paginée d'utilisateurs avec :
* * Filtrage dynamique (role, search, date)
* * Pagination (page, limit)
* * Données enrichies (wallet, roles, stats)
*
* ---
* 🧠 CONCEPTS UTILISÉS :
* ---
* * Pagination (skip / take)
* * Dynamic query building (where conditionnel)
* * Prisma relations (include)
* * Aggregation (_count)
* * Data transformation (DTO pattern)
* * Transaction (consistance read)
*
* ---
* 📥 QUERY PARAMS :
* ---
* @param {number} page       -> numéro de page (default: 1)
* @param {number} limit      -> nombre d'éléments par page (max: 50)
* @param {string} search     -> recherche sur name/email
* @param {string} role       -> filtre par rôle (USER, CREATOR, ADMIN...)
* @param {string} startDate  -> filtre date début (ISO)
* @param {string} endDate    -> filtre date fin (ISO)
*
* ---
* 📤 RESPONSE :
* ---
* {
* data: [
* ```
  {
  ```
* ```
    id,
  ```
* ```
    name,
  ```
* ```
    email,
  ```
* ```
    avatar_url,
  ```
* ```
    roles: ["CREATOR"],
  ```
* ```
    totalSeries: number,
  ```
* ```
    revenue: number,
  ```
* ```
    balance: number,
  ```
* ```
    createdAt
  ```
* ```
  }
  ```
* ],
* meta: {
* ```
  total,
  ```
* ```
  totalPages,
  ```
* ```
  page,
  ```
* ```
  limit
  ```
* }
* }
*
* ============================================================
  */

const getPaginate = async (req, res, next) => {
  try {
    // ---------------------------------------------------------
    // 1️⃣ EXTRACTION & SANITIZATION DES PARAMÈTRES
    // ---------------------------------------------------------
    // On récupère les paramètres query avec valeurs par défaut
    const {
      page = 1,
      limit = 6,
      search = "",
      startDate,
      endDate,
      role,
    } = req.query;

    // ⚠️ Protection backend : limite max pour éviter surcharge DB
    const take = Math.min(Number(limit), 50);

    // Calcul offset SQL (pagination classique)
    const skip = (Number(page) - 1) * take;

    // ---------------------------------------------------------
    // 2️⃣ CONSTRUCTION DYNAMIQUE DU WHERE (PRISMA)
    // ---------------------------------------------------------
    // On construit un objet "where" uniquement avec les filtres présents
    const where = {
      /**
       * 🎭 FILTRE PAR ROLE (relation)
       * - "some" = au moins un rôle correspond
       * - supporte multi-role users
       */
      ...(role && {
        roles: {
          some: {
            role: {
              roleKey: role.toUpperCase(), // normalisation
            },
          },
        },
      }),

      /**
       * 🔍 SEARCH (nom + email)
       * - OR → match sur l’un OU l’autre
       * - mode insensitive → ignore casse
       */
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),

      /**
       * 📅 FILTRE DATE DE CRÉATION
       * - gte = greater than or equal
       * - lte = lower than or equal
       */
      ...(startDate && {
        createdAt: {
          gte: new Date(startDate),
        },
      }),

      ...(endDate && {
        createdAt: {
          lte: new Date(endDate),
        },
      }),
    };

    // ---------------------------------------------------------
    // 3️⃣ REQUÊTE DB OPTIMISÉE (TRANSACTION)
    // ---------------------------------------------------------
    // ⚡ On exécute en parallèle :
    // - récupération des users
    // - count total (pagination)
    const [users, total] = await prisma.$transaction([
      prisma.utilisateur.findMany({
        where,
        skip,
        take,

        // Tri par défaut (dernier inscrit)
        orderBy: {
          createdAt: "desc",
        },

        // 🔗 Relations nécessaires uniquement
        include: {
          /**
           * 💰 Wallet (revenus)
           * - select = optimisation (évite overfetch)
           */
          wallet: {
            select: {
              balance: true,
              totalEarned: true,
            },
          },

          creatorStats: true,

          /**
           * 🎭 Roles utilisateur
           */
          roles: {
            select: {
              role: {
                select: {
                  roleKey: true,
                  name: true,
                },
              },
            },
          },

          /**
           * 📊 Aggregation : nombre de séries
           */
          _count: {
            select: {
              series: true,
            },
          },
        },
      }),

      // total pour pagination
      prisma.utilisateur.count({ where }),
    ]);

    // ---------------------------------------------------------
    // 4️⃣ TRANSFORMATION DES DONNÉES (DTO)
    // ---------------------------------------------------------
    // ⚠️ Très important :
    // - on ne renvoie PAS la DB brute
    // - on structure pour le frontend
    const formatted = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,

      // Transformation URL (backend → frontend)
      avatar_url: Utils.buildFullFileUrl(req, user.avatar_url),

      /**
       * 🎭 Roles flatten
       * Prisma → tableau relationnel → simple array
       */
      roles: user.roles.map((r) => r.role.roleKey),

      /**
       * 📊 Stats
       */
      totalSeries: user._count.series,
      totalViews: user.creatorStats?.totalViews ?? 0,

      /**
       * 💰 Finance
       * - fallback à 0 si pas de wallet
       */
      revenue: user.wallet?.totalEarned || 0,
      balance: user.wallet?.balance || 0,

      createdAt: user.createdAt,
    }));

    // ---------------------------------------------------------
    // 5️⃣ MÉTADONNÉES PAGINATION
    // ---------------------------------------------------------
    const totalPages = Math.ceil(total / take);

    // ---------------------------------------------------------
    // 6️⃣ RESPONSE API STANDARDISÉE
    // ---------------------------------------------------------
    return ApiReponse.success(res, "Users list", {
      list: formatted,
      pagination: {
        total,
        totalPages,
        prevPage: skip ? Number(page) - 1 : null,
        nextpage: totalPages - Number(page) ? Number(page) + 1 : null,
        page: Number(page),
        limit: take,
      },
    });
  } catch (error) {
    /**
     * 🛑 Gestion d’erreur centralisée
     * → middleware global
     */
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.utilisateur.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        wallet: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    users.forEach((user) => {
      user.password = "***************";
      user.avatar_url = Utils.buildFullFileUrl(req, user.avatar_url);
    });
    return ApiReponse.success(res, "Users retrieved successfully", users, 200);
  } catch (error) {
    next(error);
  }
};

const getByIdUsers = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) {
      return ApiReponse.error(res, "User ID is required", 400);
    }
    const user = await prisma.utilisateur.findFirst({
      where: {
        id: parseInt(id),
      },
      include: {
        wallet: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) {
      return ApiReponse.error(res, "User not found", 404);
    }
    user.password = "***************";
    user.avatar_url = Utils.buildFullFileUrl(req, user.avatar_url);
    return ApiReponse.success(res, "User retrieved successfully", user, 200);
  } catch (error) {
    next(error);
  }
};

const createUsers = async (req, res, next) => {
  const body = req.body;

  try {
    if (!body) {
      return ApiReponse.error(res, "Request body is required", 400);
    }

    const userRole = await prisma.role.findUnique({
      where: { roleKey: "USER" },
    });

    if (!userRole) {
      return ApiReponse.notFound(res, "Default role not found", 500);
    }

    const existingUser = await prisma.utilisateur.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return ApiReponse.error(res, "Email Already used", 400);
    }

    const hashed = await bcrypt.hash(body.password, 10);

    // 🔐 TRANSACTION
    const newUser = await prisma.$transaction(async (tx) => {
      // 1️⃣ Create user
      const createdUser = await tx.utilisateur.create({
        data: {
          ...body,
          password: hashed,
          avatar_url: "/uploads/users/default.png",
        },
      });

      // 2️⃣ Assign role
      await tx.userHasRole.create({
        data: {
          userId: createdUser.id,
          roleId: userRole.id,
        },
      });

      // 3️⃣ Create wallet automatically
      await tx.wallet.create({
        data: {
          userId: createdUser.id,
          balanceCoins: 50, // solde initial USER
          totalEarned: 50,
          totalSpent: 0,
        },
      });

      return createdUser;
    });

    newUser.password = "***************";
    newUser.avatar_url = Utils.buildFullFileUrl(req, newUser.avatar_url);

    return ApiReponse.success(res, "User created successfully", newUser, 201);
  } catch (error) {
    next(error);
  }
};

const updateUsers = async (req, res, next) => {
  const id = req.params.id;
  const body = req.body;
  try {
    if (!id) {
      return ApiReponse.error(res, "User ID is required", 400);
    }
    if (!body) {
      return ApiReponse.error(res, "Request body is required", 400);
    }
    const user = prisma.utilisateur.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!user) {
      return ApiReponse.notFound(res, "User not found", 404);
    }
    const updatedUser = await prisma.utilisateur.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...user,
        body,
      },
    });
    updatedUser.password = "***************";
    updatedUser.avatar_url = Utils.buildFullFileUrl(
      req,
      updatedUser.avatar_url,
    );
    return ApiReponse.success(
      res,
      "User updated successfully",
      updatedUser,
      200,
    );
  } catch (error) {
    next(error);
  }
};
const modifyInformationController = async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    const { name, email, biography, country, phone, image } = req.body;

    if (!userId) {
      return ApiReponse.error(res, "Unauthorized", 401);
    }

    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return ApiReponse.notFound(res, "User not found", 404);
    }

    // 🔥 whitelist des champs modifiables
    const dataToUpdate = {};

    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (biography) dataToUpdate.biography = biography;
    if (country) dataToUpdate.country = country;
    if (phone) dataToUpdate.phone = phone;
    if (req.file) {
      dataToUpdate.avatar_url = Utils.extractUploadRelativePath(req.file.path);
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id: userId },
      data: dataToUpdate,
    });
    console.log("updatedUser.avatar_url : ", updatedUser.avatar_url);

    // 🔒 sécuriser la réponse
    updatedUser.password = "***************";

    // 🔥 transformer URL avatar
    if (updatedUser.avatar_url) {
      updatedUser.avatar_url = Utils.buildFullFileUrl(
        req,
        updatedUser.avatar_url,
      );
    }

    console.log("updatedUser.avatar_url : ", updatedUser.avatar_url);

    return ApiReponse.success(
      res,
      "User updated successfully",
      updatedUser,
      200,
    );
  } catch (error) {
    next(error);
  }
};

const getMeController = async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);

    if (!userId) {
      return ApiReponse.error(res, "Unauthorized", 401);
    }

    const user = await UserService.getMe(userId);

    if (!user) {
      return ApiReponse.notFound(res, "User not found", 404);
    }

    const safeUser = {
      ...user,
      password: "***************",
    };

    if (safeUser.avatar_url) {
      safeUser.avatar_url = Utils.buildFullFileUrl(req, safeUser.avatar_url);
    }

    if (safeUser.cover_url) {
      safeUser.cover_url = Utils.buildFullFileUrl(req, safeUser.cover_url);
    }

    return ApiReponse.success(res, "User fetched successfully", safeUser, 200);
  } catch (error) {
    next(error);
  }
};

const deleteUsers = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) {
      return ApiReponse.error(res, "User ID is required", 400);
    }
    if (req.user.id === parseInt(id)) {
      return ApiReponse.error(res, "You cannot delete yourself", 400);
    }
    const user = prisma.utilisateur.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) {
      return ApiReponse.notFound(res, "User not found", 404);
    }
    const isAdmin = user.roles.some((r) => r.role.roleKey === "ADMIN");
    if (isAdmin) {
      const adminCount = prisma.userHasRole.count({
        where: {
          role: {
            roleKey: "ADMIN",
          },
        },
      });
      if (adminCount <= 1) {
        return ApiReponse.error(res, "Cannot delete the last admin", 400);
      }
    }
    const deletedUser = await prisma.utilisateur.delete({
      where: {
        id: parseInt(id),
      },
    });
    deletedUser.password = "***************";
    deletedUser.avatar_url = Utils.buildFullFileUrl(
      req,
      deletedUser.avatar_url,
    );
    return ApiReponse.success(
      res,
      "User deleted successfully",
      deletedUser,
      200,
    );
  } catch (error) {
    next(error);
  }
};
const BanUsers = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) {
      return ApiReponse.error(res, "User ID is required", 400);
    }
    if (req.user.id === parseInt(id)) {
      return ApiReponse.error(res, "You cannot delete yourself", 400);
    }
    const user = await prisma.utilisateur.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) {
      return ApiReponse.notFound(res, "User not found", 404);
    }
    const isAdmin = user.roles.some((r) => r.role.roleKey === "ADMIN");
    if (isAdmin) {
      const adminCount = await prisma.userHasRole.count({
        where: {
          role: {
            roleKey: "ADMIN",
          },
        },
      });
      if (adminCount <= 1) {
        return ApiReponse.error(res, "Cannot delete the last admin", 400);
      }
    }
    const deletedUser = await prisma.utilisateur.update({
      where: {
        id: parseInt(id),
      },
      data: {
        deletedAt: new Date(),
        status: "Banned",
      },
    });
    deletedUser.password = "***************";
    deletedUser.avatar_url = Utils.buildFullFileUrl(
      req,
      deletedUser.avatar_url,
    );
    return ApiReponse.success(
      res,
      "User Banned successfully",
      deletedUser,
      200,
    );
  } catch (error) {
    next(error);
  }
};

const restaureUser = async (req, res, next) => {
  const id = req.params.id;
  console.log("id is : ", id);

  try {
    if (!id) {
      return ApiReponse.error(res, "User ID is required", 400);
    }
    const user = await prisma.utilisateur.update({
      where: {
        id: parseInt(id),
      },
      data: {
        deletedAt: null,
        status: "ActiveUser",
      },
    });
    return ApiReponse.success(res, "Utilisateur restauré ", user);
  } catch (error) {
    next(error);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const roleKey = req.body.roleKey || req.body.rolekey;
    const role = await prisma.role.findUnique({
      where: {
        roleKey: roleKey,
      },
    });
    if (!role) {
      return ApiReponse.error(res, "Role not found", 400);
    } else {
      // Vérifier que le rôle n’est pas déjà assigné
      const existingAssignment = await prisma.userHasRole.findUnique({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: role.id,
          },
        },
      });

      if (existingAssignment) {
        return ApiReponse.error(res, "User already has this role", 400);
      }

      await prisma.userHasRole.create({
        data: {
          userId: userId,
          roleId: role.id,
        },
      });
      return ApiReponse.success(res, "Role assigned successfully", 200);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPaginate,
  getAllUsers,
  getByIdUsers,
  createUsers,
  updateUsers,
  deleteUsers,
  BanUsers,
  restaureUser,
  assignRole,
  modifyInformationController,
  getMeController,
};
