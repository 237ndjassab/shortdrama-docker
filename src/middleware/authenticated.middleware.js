const { env } = require("../config/env.js");
const { ApiReponse } = require("../helpers/response.js");
const jwt = require("jsonwebtoken");
const { prisma } = require("../model/index.js");
const authenticated = async (req, res, next) => {
  const authorization = req.headers?.authorization;
  console.log(" authorization egale", authorization);
  if (!authorization) {
    return ApiReponse.error(res, "Authorization header is missing", 401);
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    return ApiReponse.error(res, "Token is missing", 401);
  }
  try {
    const decoded = jwt.verify(token, env.access_secret);
    console.log("decoded", decoded);
    if (!decoded || !decoded.id)
      return ApiReponse.error(res, "Invalid token", 401);

    const user = await prisma.utilisateur.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return ApiReponse.error(res, "User not found", null, 404);
    }

    // 🔥 CHECK BAN ICI
    if (user.status === "BannedUser") {
      return ApiReponse.error(res, "Your account has been banned", null, 403);
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
module.exports = {
  authenticated,
};
