const { ApiReponse } = require("../helpers/response.js");
const FavoriteService = require("../services/favorite.service.js");

const toggleFavoriteController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);

    const episodeId = parseInt(req.params.episodeId);

    const result = await FavoriteService.toggleFavorite(userId, episodeId);

    return ApiReponse.success(res, "Favorite updated", result, 200);
  } catch (error) {
    next(error);
  }
};

const getMyFavoriteSeriesController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);

    const favoriteSeries = await FavoriteService.getMyFavoriteSeries(userId);

    return ApiReponse.success(res, "My favorite series retrieved", favoriteSeries, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
    toggleFavoriteController,
    getMyFavoriteSeriesController
}
