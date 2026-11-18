const express = require("express");

const {
  initiatePaymentController,
  paymentWebhookController,
  getPaymentStatusController,
  getMyPaymentsController,
  getAllPaymentsController,
} = require("../controller/payment.controller.js");

const { authenticated } = require("../middleware/authenticated.middleware.js");

const paymentRouter = express.Router();

// 🔥 initier paiement Mobile Money
paymentRouter.post(
  "/initiate/:packId",
  authenticated,
  initiatePaymentController,
);

// 🔥 webhook Campay
paymentRouter.post("/webhook", paymentWebhookController);

// 🔥 status paiement
paymentRouter.get(
  "/status/:reference",
  authenticated,
  getPaymentStatusController,
);

// 🔥 historique paiements utilisateur
paymentRouter.get("/me", authenticated, getMyPaymentsController);
paymentRouter.get("/", authenticated, getAllPaymentsController);

module.exports = { paymentRouter };
