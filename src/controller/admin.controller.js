const { ApiReponse } = require("../helpers/response.js");
const { Utils } = require("../helpers/Utils.js");
const { AdminService } = require("../services/admin.service.js");

const getDashboardStatsController = async (req, res, next) => {
  try {
    const stats = await AdminService.getDashboardStats();
    return ApiReponse.success(res, "Dashboard retrieved successfully", stats);
  } catch (error) {
    next(error);
  }
};
const getMonthlyRevenueController = async (req, res, next) => {
  try {
    const data = await AdminService.getMonthlyRevenue();
    return ApiReponse.success(res, "Dashboard retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};

const getTopEpisodesController = async (req, res, next) => {
  try {
    const episodes = await AdminService.getTopContent();
    return ApiReponse.success(
      res,
      "Dashboard retrieved successfully",
      episodes,
    );
  } catch (error) {
    next(error);
  }
};
const getUsersByDayController = async (req, res, next) => {
  try {
    const users = await AdminService.getUsersByDay();
    return ApiReponse.success(res, "Dashboard retrieved successfully", {
      users,
    });
  } catch (error) {
    next(error);
  }
};
const getCoinsByMonthController = async (req, res, next) => {
  try {
    const coins = await AdminService.getCoinsByMonth();
    return ApiReponse.success(res, "Dashboard retrieved successfully", {
      coins,
    });
  } catch (error) {
    next(error);
  }
};

const getPlateformEarningController = async (req, res, next) => {
  try {
    const earnings = await AdminService.getPlateformEarning();
    return ApiReponse.success(res, "Platform earnings retrieved successfully", {
      earnings,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardKpisController = async (req, res, next) => {
  try {
    const [
      users,
      coins,
      earnings,
      views,
      responseTime,
      paymentConversion,
      PlatformRevenue,
      successfulTransactions,
      coinsInCirculation,
      pendingPayments,
    ] = await Promise.all([
      AdminService.getUsersByDay(),
      AdminService.getCoinsByMonth(),
      AdminService.getPlateformEarning(),
      AdminService.getEpisodesViewedLast24Hours(),
      // AdminService.getCloudinaryStorage(),
      AdminService.getAverageResponseTime(),
      AdminService.getPaymentConversionRate(),
      AdminService.getPlatformGrossRevenueKpi(),
      AdminService.getSuccessfulTransactionsKpi(),
      AdminService.getCoinsInCirculation(),
      AdminService.getPendingPaymentsKpi(),
    ]);

    return ApiReponse.success(res, "Dashboard KPI retrieved successfully", {
      users,
      coins,
      earnings,
      views,
      // cloudinaryStorage,
      responseTime,
      paymentConversion,
      PlatformRevenue,
      successfulTransactions,
      coinsInCirculation,
      pendingPayments,
    });
  } catch (error) {
    next(error);
  }
};

const getStudioAdminKpisController = async (req, res, next) => {
  const adminId = parseInt(req.user.id);
  try {
    const [AdminViews, estimatedRevenue] = await Promise.all([
      AdminService.getTotalViewsForAdmin(adminId),
      AdminService.getEstimatedRevenueForAdmin(adminId),
    ]);

    return ApiReponse.success(res, "Studio Admin KPI retrieved successfully", {
      AdminViews,
      estimatedRevenue,
    });
  } catch (error) {
    next(error);
  }
};

const getTopCreateurController = async (req, res, next) => {
  try {
    const createurs = await AdminService.getTopCreateur();
    createurs.forEach((createur) => {
      createur.creator.avatar_url = Utils.buildFullFileUrl(
        req,
        createur.creator.avatar_url,
      );
    });
    return ApiReponse.success(
      res,
      "Dashboard retrieved successfully",
      createurs,
    );
  } catch (error) {
    next(error);
  }
};

const getCloudinaryStorageController = async (req, res, next) => {
  try {
    const storage = await AdminService.getCloudinaryStorage();

    return ApiReponse.success(
      res,
      "Cloudinary storage retrieved successfully",
      storage,
    );
  } catch (error) {
    next(error);
  }
};

const getTransactionsController = async (req, res, next) => {
  try {
    const transactions = await AdminService.getTransactions();

    return ApiReponse.success(
      res,
      "Transactions retrieved successfully",
      transactions,
    );
  } catch (error) {
    next(error);
  }
};

const getTopCoinsPackController = async (req, res, next) => {
  try {
    const result = await AdminService.getTopCoinsPack();
    return ApiReponse.success(
      res,
      "Top Pack Of Coins retrieved successfully",
      result,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStatsController,
  getMonthlyRevenueController,
  getTopEpisodesController,
  getTopCoinsPackController,
  getTopCreateurController,
  getUsersByDayController,
  getCoinsByMonthController,
  getPlateformEarningController,
  getDashboardKpisController,
  getCloudinaryStorageController,
  getTransactionsController,
  getStudioAdminKpisController,
};
