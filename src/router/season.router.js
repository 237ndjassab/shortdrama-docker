const express = require("express");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const { authorize } = require("../middleware/authorize.middleware.js");
const {
  getSeasonsBySeriesController,
  createSeasonController,
  updateSeasonController,
  deleteSeasonController,
} = require("../controller/season.controller.js");
const seasonRouter = express.Router();

//PUBLIC
seasonRouter.get("/serie/:id", authenticated, getSeasonsBySeriesController);

//CREATOR / ADMIN
seasonRouter.post(
  "/",
  authenticated,
  authorize("SEASON:CREATE"),
  createSeasonController,
); //authorize("SEASON:CREATE");

seasonRouter.put(
  "/:id",
  authenticated,
  authorize("SEASON:UPDATE"),
  updateSeasonController,
); //authorize("SEASON:UPDATE");
seasonRouter.delete(
  "/:id",
  authenticated,
  authorize("SEASON:DELETE"),
  deleteSeasonController,
); //authorize("SEASON:DELETE")

module.exports = { seasonRouter };
