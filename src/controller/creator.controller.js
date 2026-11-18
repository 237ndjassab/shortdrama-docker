const { ApiReponse } = require("../helpers/response.js");
const { Utils } = require("../helpers/Utils.js");
const { CreatorService } = require("../services/creator.service.js");

const requestCreatorController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await CreatorService.requestCreator(userId, req.body);

    return ApiReponse.success(res, "Creator request submitted", result);
  } catch (error) {
    next(error);
  }
};

const getAllCreatorRequestsController = async (req, res, next) => {
  try {
    const requests = await CreatorService.getAllRequests();
    requests.forEach((request) => {
      if (request.user.avatar_url) {
        request.user.avatar_url = Utils.buildFullFileUrl(req, request.user.avatar_url);
        request.user.password = "***********";
      }
    });

    return ApiReponse.success(res, "Creator requests fetched", requests);
  } catch (error) {
    next(error);
  }
};

const approveCreatorRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await CreatorService.approveCreator(Number(id));

    return ApiReponse.success(res, "Creator approved", result);
  } catch (error) {
    next(error);
  }
};

const rejectCreatorRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await CreatorService.rejectCreator(Number(id), reason);

    return ApiReponse.success(res, "Creator rejected", result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestCreatorController,
  getAllCreatorRequestsController,
  approveCreatorRequestController,
  rejectCreatorRequestController,
};
