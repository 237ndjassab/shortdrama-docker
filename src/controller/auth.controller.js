const jwt = require("jsonwebtoken");
const { transporter } = require("../config/email.config.js");
const { env } = require("../config/env.js");
const { ApiReponse } = require("../helpers/response.js");
const { Utils } = require("../helpers/Utils.js");
const { prisma } = require("../model/index.js");
const bcrypt = require("bcrypt");

const register = async (req, res, next) => {
  const body = req.body;

  try {
    const userRole = await prisma.role.findUnique({
      where: { roleKey: "USER" },
    });

    if (!userRole) {
      return ApiReponse.notFound(res, "Default role not found", 500);
    }

    const userExisting = await prisma.utilisateur.findFirst({
      where: { email: body.email },
    });

    if (userExisting) {
      return ApiReponse.error(res, "Email already in use", null, 409);
    }

    body.password = await bcrypt.hash(body.password, 10);

    // 🔥 TRANSACTION
    const newUser = await prisma.$transaction(async (tx) => {
      // 1️⃣ Create user
      const createdUser = await tx.utilisateur.create({
        data: {
          name: body.name,
          email: body.email,
          password: body.password,
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

      // 3️⃣ Create wallet automatiquement
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

    // 📩 Email (hors transaction)
    const mailOptions = {
      from: env.mailuser,
      to: body.email,
      subject: "Welcome to ShortDramaAfrica",
      text: `Hello ${body.name},\n\nThank you for registering at ShortDramaAfrica.`,
      html: `<h1>Welcome, ${body.name}!</h1><p>Thank you for registering at ShortDramaAfrica.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    newUser.avatar_url = Utils.buildFullFileUrl(req, newUser.avatar_url);
    newUser.password = "***************";

    return ApiReponse.success(res, "User created successfully", newUser, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  // Login logic here
  const body = req.body;
  console.log("Login attempt:", body);
  try {
    const user = await prisma.utilisateur.findFirst({
      where: {
        email: body.email,
      },
      include: {
        wallet: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) {
      return ApiReponse.error(res, "Invalid email", null, 401);
    }
    if (user.status === "Banned") {
      return ApiReponse.error(
        res,
        "Your account has been banned. Contact support.",
        null,
        403,
      );
    }
    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      return ApiReponse.error(res, "Invalid password", null, 401);
    }

    /**
     * Liste des rôles de l'utilisateur
     */
    const roles = user.roles.map((userRole) => {
      return userRole.role.roleKey;
    });
    console.log("roles : ", roles);

    /**
     * Construction de la liste des permissions complètes
     * (avec permissionKey + nom) pour chaque rôle
     */
    const permissions = user.roles.flatMap((userRole) => {
      return userRole.role.permissions.map((permission) => {
        console.log("valeur de la constante : ", permission);
        return {
          permissionKey: permission.permission.permissionKey,
          title: permission.permission.name,
        };
      });
    });
    console.log(permissions);

    /**
     * Extraire uniquement les clés de permissions (plus simple à utiliser dans le frontend)
     */

    const permissionKeys = user.roles.flatMap((userRole) => {
      return userRole.role.permissions.map((permission) => {
        return permission.permission.permissionKey;
      });
    });

    /**
     * Suppression des doublons dans les permissions
     * On utilise une Map pour conserver seulement 1 permission par clé unique
     */

    const uniquePermissions = Array.from(
      new Map(
        permissions.map((permission) => {
          return [permission.permissionKey, permission];
        }),
      ).values(),
    );

    const accessToken = jwt.sign({ id: user.id, roles }, env.access_secret, {
      expiresIn: env.access_expires_in,
    });
    const refreshToken = jwt.sign({ id: user.id, roles }, env.refresh_secret, {
      expiresIn: env.refresh_expires_in,
    });
    /**
     * Enregistrement du refreshToken dans un cookie sécurisé
     * - httpOnly : le cookie n'est pas accessible en JS → protection contre XSS
     * - secure : nécessite HTTPS
     * - sameSite "None" : obligatoire pour partager entre domaines
     */
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.APP_ENV === "production",
      sameSite: "None",
      path: "/",
      expiresIn: env.refresh_expires_in,
    });
    user.password = "***************";
    user.avatar_url = Utils.buildFullFileUrl(req, user.avatar_url);
    return ApiReponse.success(
      res,
      "Login successful",
      {
        user: {
          ...user,
          permissionKeys,
          permissions: uniquePermissions,
          roles,
          wallet: user.wallet,
        },
        token: {
          type: "Bearer",
          accessToken: accessToken,
        },
      },
      200,
    );
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  // Forgot password logic here
  const body = req.body;
  console.log("Forgot password request:", body);

  try {
    const user = await prisma.utilisateur.findFirst({
      where: {
        email: body.email,
      },
    });
    if (!user) {
      return ApiReponse.error(res, "Email not found", null, 404);
    }

    /**
     * Génération d'un code OTP (One Time Password)
     * Ici : un nombre aléatoire entre 100000 et 999999 (6 chiffres)
     */
    const otpCode = Utils.getRandomNumber(100000, 999999);
    /**
     * Définition de la date d’expiration du token.
     * Le token est valable pendant 5 minutes.
     * Date.now() → timestamp actuel
     * 5 * 60 * 1000 → 5 minutes en millisecondes
     */
    const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minutes à partir de maintenant

    const mailOptions = {
      from: env.mailuser,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Hello ${user.name},\n\nYour OTP code for password reset is: ${otpCode}. It is valid for 1 minutes.`,
      html: `<p>Hello ${user.name},</p><p>Your OTP code for password reset is: <b>${otpCode}</b>. It is valid for 1 minutes.</p>`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    const data = await prisma.utilisateur.update({
      where: {
        id: user.id,
      },
      data: {
        otpcode: otpCode,
        otpExpiresAt: otpExpiresAt,
      },
    });

    data.password = "***************";
    data.avatar_url = Utils.buildFullFileUrl(req, data.avatar_url);
    data.otpcode = "****************";
    data.otpExpiresAt = "****************";
    return ApiReponse.success(res, "OTP sent to email", data, 200);
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  // Verify OTP logic here
  const body = req.body;
  console.log("Verify OTP request:", body);

  try {
    const incomingOTP = body.otp;
    const user = await prisma.utilisateur.findFirst({
      where: {
        email: body.email,
      },
    });
    if (!user) {
      return ApiReponse.notFound(res, "Email not found", null, 404);
    }
    /**
     * Vérification que l'utilisateur a bien un OTP enregistré.
     * resetToken = OTP généré
     * resetTokenExpires = date et heure d'expiration
     *
     * Si l'un des deux n'existe pas, cela signifie que l'OTP n'a jamais été demandé.
     */
    if (!user.otpcode || !user.otpExpiresAt) {
      return ApiReponse.error(res, "Aucun OTP n'a été généré", null, 400);
    }
    if (user.otpcode === Number(incomingOTP)) {
      if (user.otpExpiresAt >= new Date()) {
        const data = await prisma.utilisateur.update({
          where: {
            id: user.id,
          },
          data: {
            otpcode: null,
            otpExpiresAt: null,
          },
        });
        data.password = "******";
        data.otpcode = "******";
        user.avatar_url = Utils.buildFullFileUrl(req, user.avatar_url);
        data.otpExpiresAt = "******";
        return ApiReponse.success(res, "OTP verified successfully", data, 200);
      } else {
        return ApiReponse.error(res, "OTP has expired", null, 400);
      }
    } else {
      return ApiReponse.error(res, "Invalid OTP", null, 400);
    }
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  // Reset password logic here
  const body = req.body;
  console.log("Reset password request:", body);

  try {
    const user = await prisma.utilisateur.findFirst({
      where: {
        email: body.email,
      },
    });
    if (!user) {
      return ApiReponse.notFound(res, "Email not found", null, 404);
    }
    body.password = await bcrypt.hash(body.password, 10);
    const data = await prisma.utilisateur.update({
      where: {
        id: user.id,
      },
      data: {
        password: body.password,
      },
    });
    data.password = "***************";
    data.avatar_url = Utils.buildFullFileUrl(req, data.avatar_url);
    data.otpcode = "****************";
    data.otpExpiresAt = "****************";
    return ApiReponse.success(res, "Password reset successfully", data, 200);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        creatorProfile: true,
        creatorStats: true,
      },
    });

    if (!user) {
      return ApiReponse.error(res, "User not found", null, 404);
    }

    // 🔥 rebuild same structure as login
    const roles = user.roles.map((userRole) => userRole.role.roleKey);

    const permissions = user.roles.flatMap((userRole) =>
      userRole.role.permissions.map((p) => ({
        permissionKey: p.permission.permissionKey,
        title: p.permission.name,
      })),
    );

    const permissionKeys = user.roles.flatMap((userRole) =>
      userRole.role.permissions.map((p) => p.permission.permissionKey),
    );

    const uniquePermissions = Array.from(
      new Map(permissions.map((p) => [p.permissionKey, p])).values(),
    );

    user.password = "***************";
    user.avatar_url = Utils.buildFullFileUrl(req, user.avatar_url);

    return ApiReponse.success(res, "User fetched", {
      ...user,
      roles,
      permissions: uniquePermissions,
      permissionKeys,
    });
  } catch (error) {
    console.log("GET ME ERROR:", error);
    return ApiReponse.error(res, "Error", null, 500);
  }
};

const refreshToken = async (req, res, next) => {
  // Refresh token logic here
  const refresh = req.cookies.refreshToken;
  if (!refresh) {
    return ApiReponse.error(res, "we haven't found any token", null, 401);
  }
  try {
    const decoded = jwt.verify(refresh, env.refresh_secret);
    if (!decoded || !decoded.id) {
      return ApiReponse.error(res, "Invalid refresh token", null, 401);
    }
    const newAccesToken = jwt.sign({ id: decoded.id }, env.access_secret, {
      expiresIn: env.access_expires_in,
    });

    return ApiReponse.success(res, "Refresh accessToken successfully.", {
      type: "Bearer",
      accessToken: newAccesToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Déconnecte un utilisateur en supprimant son refresh token.
 *
 * Fonctionnement :
 * 1. On récupère le refresh token stocké dans les cookies.
 * 2. Si un token existe → on le vérifie.
 * 3. On retrouve l'utilisateur correspondant (optionnel, mais utile pour le retour).
 * 4. On supprime le cookie contenant le refresh token.
 * 5. On renvoie une confirmation de déconnexion.
 */

const logout = async (req, res, next) => {
  const refresh = req.cookies.refreshToken;
  try {
    if (!refresh) {
      /**
       * Si aucun token n'est présent :
       * - L'utilisateur est déjà déconnecté.
       * - On renvoie quand même un succès pour éviter les erreurs inutiles.
       */
      return ApiReponse.success(res, "Logout successful", null);
    } else {
      const decoded = jwt.verify(refresh, env.refresh_secret);

      const user = await prisma.utilisateur.findFirst({
        where: {
          id: decoded.id,
        },
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: env.APP_ENV === "production",
        sameSite: "None",
        path: "/",
        expiresIn: env.refresh_expires_in,
      });
      user.password = "***************";
      user.avatar_url = Utils.buildFullFileUrl(req, user.avatar_url);
      /**
       * Même si le refresh token est invalide ou expiré,
       * on supprime quand même le cookie côté client.
       */
      // On confirme la déconnexion en renvoyant éventuellement les infos utilisateur
      return ApiReponse.success(res, "Logout successful", user);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  refreshToken,
  getMe,
  logout,
};
