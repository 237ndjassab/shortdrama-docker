const { prisma } = require("../model/index.js");

class UserService {
  static async getMe(userId) {
    return await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        creatorProfile: true,
        creatorStats: true,
        wallet: true,
      },
    });
  }
}

module.exports = { UserService };