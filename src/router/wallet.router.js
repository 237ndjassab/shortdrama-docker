const express = require("express");
const {
  depositController,
  withdrawController,
  getMyWalletController,
  getWalletTransactionsController,
  getWalletByUserId,
  buyCoinsController,
} = require("../controller/wallet.controller.js");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const { authorize } = require("../middleware/authorize.middleware.js");
const walletRouter = express.Router();

walletRouter.get("/me", authenticated, getMyWalletController);

walletRouter.get(
  "/transactions",
  authenticated,
  getWalletTransactionsController,
);

walletRouter.post("/deposit/:id", authenticated, depositController); //crediter le wallet de facon manuelle en y entrant le montant des coins a crediter

walletRouter.post("/buy-coins/:packId", authenticated, buyCoinsController) //fonction ecrie pour simuler l'achat de coins par un utilisateur

walletRouter.post(
  "/withdraw",
  authenticated,
  authorize("CREATOR:WITHDRAW"),
  withdrawController,
);

//deja fait
walletRouter.get("/:id", authenticated, authorize("WALLET:VIEW"), getWalletByUserId);
//WALLET:VIEW   --LA PERMISSION NECESSAIRE POUR ACCEDER A CETTE ROUTE
module.exports = { walletRouter };
