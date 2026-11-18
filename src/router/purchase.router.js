const express = require("express");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const {
  getMyPurchasesController,
  getEpisodePurchasesController,
} = require("../controller/purchase.controller.js");
const { authorize } = require("../middleware/authorize.middleware.js");
const purchaseRouter = express.Router();

purchaseRouter.get(
  "/me",
  authenticated,
  authorize("EPISODE:VIEW_PURCHASES_FOR_USER"),
  getMyPurchasesController,
);

//EPISODE:VIEW_PURCHASES_FOR_USER   --LA PERMISSION NECESSAIRE POUR ACCEDER A CETTE ROUTE
purchaseRouter.get(
  "/episode/:id",
  authenticated,
  authorize("EPISODE:VIEW_PURCHASES"),
  getEpisodePurchasesController,
);
//EPISODE:VIEW_PURCHASES   --LA PERMISSION NECESSAIRE POUR ACCEDER A CETTE ROUTE
module.exports = { purchaseRouter };
