const express = require("express");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const {
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
} = require("../controller/admin.controller.js");
const { authorize } = require("../middleware/authorize.middleware.js");
const adminRouter = express.Router();

adminRouter.get(
  "/dashboard",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getDashboardStatsController,
);
adminRouter.get(
  "/revenue/monthly",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getMonthlyRevenueController,
);


adminRouter.get(
  "/top-episodes",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getTopEpisodesController,
);
adminRouter.get(
  "/users-byDay",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getUsersByDayController,
);
adminRouter.get(
  "/coins-byMonth",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getCoinsByMonthController,
);
adminRouter.get(
  "/plateformEarning",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getPlateformEarningController,
);
adminRouter.get(
  "/dashboard-kpis",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getDashboardKpisController,
);
adminRouter.get(
  "/StudioAdmin-kpis",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getStudioAdminKpisController,
);
adminRouter.get(
  "/top-createur",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getTopCreateurController,
);
adminRouter.get(
  "/cloudinary-storage",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getCloudinaryStorageController,
);
adminRouter.get(
  "/transactions",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getTransactionsController,
);


adminRouter.get(
  "/coin-packs/top",
  authenticated,
  authorize("ADMIN:DASHBOARD"),
  getTopCoinsPackController,
);
//ADMIN:DASHBOARD --LA PERMISSION REQUISE POUR ACCCEDER A CETTE ROUTE

module.exports = { adminRouter };
