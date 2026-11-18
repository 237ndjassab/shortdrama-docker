const express = require("express");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const { toggleFavoriteController, getMyFavoriteSeriesController } = require("../controller/favorite.controller.js");
const favoriteRouter = express.Router();

favoriteRouter.post("/toggle/:episodeId", authenticated, toggleFavoriteController);
favoriteRouter.get("/my-favorites", authenticated, getMyFavoriteSeriesController);

module.exports = { favoriteRouter };