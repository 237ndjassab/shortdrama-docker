const { ApiReponse } = require("../helpers/response.js");
const CampayService = require("../services/campay.service.js");
const crypto = require("crypto");

const testTokenController = async (req, res, next) => {
  try {
    const token = await CampayService.getToken();
    return ApiReponse.success(res, "token retrieved successfully", token);
  } catch (error) {
    next(error);
  }
};

const testCollectController = async (req, res, next) => {
  try {
    const { amount, phoneNumber, description } = req.body;

    if (!amount || !phoneNumber || !description) {
      return ApiReponse.error(res, "Tous les champs sont obligatoires", 400);
    }
    if (!phoneNumber.startsWith("237")) {
      throw new Error("Numéro invalide");
    }

    const payment = await CampayService.requestPayment({
      amount,
      phoneNumber,
      description,

      reference: crypto.randomUUID(),
    });

    return ApiReponse.success(res, "Paiement initié avec succès", payment);
  } catch (error) {
    next(error);
  }
};
module.exports = { testTokenController, testCollectController };
