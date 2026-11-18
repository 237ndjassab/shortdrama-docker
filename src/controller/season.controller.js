const { ApiReponse } = require("../helpers/response.js");
const { SeasonService } = require("../services/season.service.js");

const getSeasonsBySeriesController = async (req, res, next) => {
  try {
    const seriesId = Number(req.params.id);
    const userId = req.user.id;
    const data = await SeasonService.getBySeries({ seriesId, userId });
    return ApiReponse.success(res, "season retrieved by serie", data);
  } catch (error) {
    next(error);
  }
};

const createSeasonController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await SeasonService.create({
      ...req.body,
      userId,
    });
    return ApiReponse.success(res, "Season created", data);
  } catch (error) {
    next(error);
  }
};

const updateSeasonController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.user.id);
    const { description } = req.body;
    console.log("req.body : ", req.body);
    const data = await SeasonService.update(id, description, userId);
    return ApiReponse.success(res, "season updated ", data);
  } catch (error) {
    next(error);
  }
};
const deleteSeasonController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const data = await SeasonService.delete(id, userId);
    return ApiReponse.success(res, "season deleted ", data);
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getSeasonsBySeriesController,
  createSeasonController,
  updateSeasonController,
  deleteSeasonController,
};
