const { ApiReponse } = require("../helpers/response.js");
const { PurchaseService } = require("../services/purchase.service.js");

const getMyPurchasesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const purchases = await PurchaseService.getMyPurchases(userId);
    return ApiReponse.success(
      res,
      "Purchases retrieved successfully",
      purchases,
    );
  } catch (error) {
    next(error);
  }
};

const getEpisodePurchasesController = async (req, res, next) => {
  try {
    const episodeId = parseInt(req.params.id);
    const purchases = await PurchaseService.getEpisodePurchases(episodeId);
    return ApiReponse.success(
      res,
      "Episode purchases retrieved successfully",
      purchases,
    );
  } catch (error) {
    next(error);
  }
};
module.exports = { getMyPurchasesController, getEpisodePurchasesController };
