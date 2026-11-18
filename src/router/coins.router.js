const express = require("express");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const { authorize } = require("../middleware/authorize.middleware.js");
const {
  getCoinPacksController,
  createCoinPackController,
  updateCoinPackController,
  deleteCoinPackController,
  activeCoinPackController,
  inactiveCoinPackController,
} = require("../controller/coin.controller.js");
const multer = require("multer");
const { diskStorage } = require("../config/multer.config.js");
const coinRouter = express.Router();

const upload = multer({ storage: diskStorage, preservePath: false });

// get de l'utilisateur connecté
coinRouter.get("/", authenticated, getCoinPacksController);

coinRouter.post(
  "/admin",
  upload.single("image"),
  authenticated,
  authorize("ADMIN:COIN_PACK"),
  createCoinPackController,
); //authorize("ADMIN:COIN_PACK")

coinRouter.get("/admin", authenticated, getCoinPacksController); //authorize("ADMIN:COIN_PACK")

coinRouter.put(
  "/admin/:id",
  upload.single("image"),
  authenticated,
  authorize("ADMIN:COIN_PACK"),
  updateCoinPackController,
); //authorize("ADMIN:COIN_PACK")

coinRouter.delete(
  "/admin/:id",
  authenticated,
  authorize("ADMIN:COIN_PACK"),
  deleteCoinPackController,
); //authorize("ADMIN:COIN_PACK")
coinRouter.put(
  "/admin/active/:id",
  authenticated,
  authorize("ADMIN:COIN_PACK"),
  activeCoinPackController,
); //authorize("ADMIN:COIN_PACK")
coinRouter.put(
  "/admin/inactive/:id",
  authenticated,
  authorize("ADMIN:COIN_PACK"),
  inactiveCoinPackController,
); //authorize("ADMIN:COIN_PACK")

module.exports = { coinRouter };
