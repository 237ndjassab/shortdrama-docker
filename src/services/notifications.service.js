const { prisma } = require("../model");

class NotificationService {
  /**
   * Créer une notification
   */
  static async create(data) {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Notifications d'un utilisateur
   */
  static async getByUser(userId) {
    return await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Marquer une notification comme lue
   */
  static async markAsRead(id, userId) {
    return await prisma.notification.update({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Tout marquer comme lu
   */
  static async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Nombre de notifications non lues
   */
  static async unreadCount(userId) {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Supprimer une notification
   */
  static async delete(id, userId) {
    return await prisma.notification.delete({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Supprimer toutes les notifications
   */
  static async deleteAll(userId) {
    return await prisma.notification.deleteMany({
      where: {
        userId,
      },
    });
  }
}

module.exports = {
  NotificationService,
};