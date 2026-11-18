const { ApiReponse } = require("../helpers/response.js");
const { Utils } = require("../helpers/Utils.js");

const authorize = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const allowed = await Utils.hasPermission(userId, permissionKey);
      if (!allowed) {
        return ApiReponse.error(
          res,
          "Access denied. Insufficient permissions.",
          403,
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authorize };
