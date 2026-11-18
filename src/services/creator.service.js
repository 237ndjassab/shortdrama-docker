const { prisma } = require("../model/index.js");
const { NotificationService } = require("./notifications.service.js");

class CreatorService {
  static async requestCreator(userId, data) {
    const existing = await prisma.creatorProfile.findUnique({
      where: { userId },
    });

    // 🔥 déjà approuvé
    if (existing?.status === "APPROVED") {
      throw new Error("User is already a creator");
    }

    // 🔥 demande déjà en attente
    if (existing?.status === "PENDING") {
      throw new Error("Creator request already pending");
    }

    // 🔥 si rejeté → réutiliser le profil
    if (existing?.status === "REJECTED") {
      return await prisma.creatorProfile.update({
        where: {
          userId,
        },
        data: {
          initialReason: data.initialReason,
          portfolio: data.portfolio || "",
          biography: data.biography || "",
          country: data.country || "",
          youtubeUrl: data.youtubeUrl || "",
          instagramUrl: data.instagramUrl || "",

          // reset review
          reviewedAt: null,
          rejectionReason: null,

          // nouvelle demande
          status: "PENDING",
        },
      });
    }

    // 🔥 première demande
    return await prisma.creatorProfile.create({
      data: {
        userId,
        initialReason: data.initialReason,
        portfolio: data.portfolio || "",
        biography: data.biography || "",
        country: data.country || "",
        youtubeUrl: data.youtubeUrl || "",
        instagramUrl: data.instagramUrl || "",
        status: "PENDING",
      },
    });
  }

  static async getAllRequests() {
    return await prisma.creatorProfile.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: true,
      },
      orderBy: {
        requestedAt: "desc",
      },
    });
  }

  static async approveCreator(id) {
    const creatorProfileId = Number(id);

    // 🔥 vérifier si le profil existe
    const existingProfile = await prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
    });

    if (!existingProfile) {
      throw new Error("Creator profile introuvable");
    }

    // 🔥 vérifier si le rôle existe
    const role = await prisma.role.findUnique({
      where: { roleKey: "CREATOR" },
    });

    if (!role) {
      throw new Error("Le rôle CREATOR n'existe pas");
    }

    const request = await prisma.$transaction(async (tx) => {
      // ✅ approve profile
      const request = await tx.creatorProfile.update({
        where: { id: creatorProfileId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
        },
      });

      // ✅ vérifier si le user a déjà le rôle
      const existingUserRole = await tx.userHasRole.findFirst({
        where: {
          userId: request.userId,
          roleId: role.id,
        },
      });

      if (!existingUserRole) {
        await tx.userHasRole.create({
          data: {
            userId: request.userId,
            roleId: role.id,
          },
        });
      }

      // ✅ vérifier si stats existent déjà
      const existingStats = await tx.creatorStats.findUnique({
        where: {
          userId: request.userId,
        },
      });

      if (!existingStats) {
        await tx.creatorStats.create({
          data: {
            userId: request.userId,
          },
        });
      }

      return request;
    });

    // ✅ créer la notification
    try {
      await NotificationService.create({
        userId: request.userId,
        title: "Demande approuvée 🎉",
        message:
          "Félicitations ! Votre demande de créateur a été approuvée. Vous pouvez maintenant publier vos séries.",
        type: "CREATOR_APPROVED",
        metadata: {
          creatorProfileId: request.id,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la création de la notification :", error);
    }

    return request;
  }

  static async rejectCreator(id, reason) {
    const creatorProfileId = Number(id);

    // 🔥 validation id
    if (isNaN(creatorProfileId)) {
      throw new Error("ID invalide");
    }

    // 🔥 validation raison
    if (!reason || !reason.trim()) {
      throw new Error("Le motif du rejet est obligatoire");
    }

    // 🔥 vérifier si le profil existe
    const existingProfile = await prisma.creatorProfile.findUnique({
      where: {
        id: creatorProfileId,
      },
    });

    if (!existingProfile) {
      throw new Error("Creator profile introuvable");
    }

    // 🔥 éviter de rejeter plusieurs fois
    if (existingProfile.status === "REJECTED") {
      throw new Error("Cette demande est déjà rejetée");
    }

    const request = await prisma.creatorProfile.update({
      where: {
        id: creatorProfileId,
      },
      data: {
        status: "REJECTED",
        rejectionReason: reason.trim(),
        reviewedAt: new Date(),
      },
    });

    await NotificationService.create({
      userId: request.userId,
      title: "Demande refusée",
      message: `Votre demande de créateur a été refusée.\nMotif : ${reason}`,
      type: "CREATOR_REJECTED",
      metadata: {
        creatorProfileId: request.id,
      },
    });

    return request;
  }
}

module.exports = { CreatorService };
