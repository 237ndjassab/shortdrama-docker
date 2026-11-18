const { UPLOAD_DIR } = require("../config/multer.config.js");
const { prisma } = require("../model/index.js");

class Utils {
  /**
   * Extrait le chemin relatif à partir d'un chemin absolu généré par Multer.
   * Exemple :
   *   D:\projet\uploads\image-xxx.jpg  -->  /uploads/image-xxx.jpg
   *
   * @param {string} fullPath - Le chemin complet du fichier.
   * @returns {string} - Le chemin relatif commençant par /uploads/...
   */
  static extractUploadRelativePath(fullPath) {
    if (!fullPath) return "";

    // Normaliser les séparateurs pour uniformiser Windows / Linux
    const normalizedPath = fullPath.replace(/\\/g, "/");

    // Trouver la position du dossier "uploads"
    const uploadsIndex = normalizedPath.indexOf(UPLOAD_DIR);

    // Si "uploads" n'est pas trouvé, retourner le chemin normalisé
    if (uploadsIndex === -1) return normalizedPath;

    // Extraire à partir de "/uploads/"
    return normalizedPath.substring(uploadsIndex);
  }

  /**
   * Construit l'URL complète (publique) d'un fichier uploadé.
   * Exemple :
   *   (req, '/uploads/image-xxx.jpg') --> http://localhost:3000/uploads/image-xxx.jpg
   *
   * @param {object} req - L'objet Request d'Express (pour récupérer host et protocole).
   * @param {string} relativePath - Le chemin relatif du fichier (ex: /uploads/xxx.jpg).
   * @returns {string} - L'URL complète du fichier.
   */
  static buildFullFileUrl(req, relativePath) {
    if (!relativePath) return "";

    const protocol = req.protocol;
    const host = req.get("host");

    return `${protocol}://${host}${relativePath}`;
  }

  static getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  static async hasPermission(userId, permissionKey) {
    const user = await prisma.utilisateur.findUnique({
      where: {
        id: userId,
      },
      include: {
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
    if (!user) return false;
    const permissionKeys = user.roles.flatMap((userRole) =>
      userRole.role.permissions.map((p) => p.permission.permissionKey),
    );
    const uniquePermissionKeys = [...new Set(permissionKeys)];

    return uniquePermissionKeys.includes(permissionKey);
  }
}

module.exports = {
  Utils,
};
