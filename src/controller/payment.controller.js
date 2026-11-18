const { ApiReponse } = require("../helpers/response.js");
const PaymentService = require("../services/payment.service.js");

const initiatePaymentController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);

    const packId = parseInt(req.params.packId);

    const { phoneNumber } = req.body;

    const result = await PaymentService.initiatePayment({
      userId,
      packId,
      phoneNumber,
    });

    return ApiReponse.success(res, "Paiement initié", result);
  } catch (error) {
    next(error);
  }
};

const paymentWebhookController = async (req, res, next) => {
  try {
    const payload = req.body;

    const result = await PaymentService.handleWebhook(payload);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPaymentStatusController = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const result = await PaymentService.getPaymentStatus(reference);

    return ApiReponse.success(res, "Payment status", result);
  } catch (error) {
    next(error);
  }
};

const getMyPaymentsController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);

    const payments = await PaymentService.getUserPayments(userId);

    return ApiReponse.success(res, "Payments retrieved", payments);
  } catch (error) {
    next(error);
  }
};

const getAllPaymentsController = async (req, res, next) => {
  try {
    const payments = await PaymentService.getAllPayments();

    return ApiReponse.success(res, "Payments retrieved", payments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePaymentController,
  paymentWebhookController,
  getPaymentStatusController,
  getMyPaymentsController,
  getAllPaymentsController
};
