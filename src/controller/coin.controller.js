const { ApiReponse } = require("../helpers/response.js");
const { Utils } = require("../helpers/Utils.js");
const { CoinPackService } = require("../services/coin.service.js");

const getCoinPacksController = async (req, res, next) => {
  try {
    const isAdmin = req.user?.roles?.some(
      (r) => r === "ADMIN" || r.roleKey === "ADMIN",
    );
    console.log("users informations :", req.user);
    console.log("Roles:", req.user?.roles);
    console.log("isAdmin:", isAdmin);
    const data = await CoinPackService.getAll(isAdmin);
    data.forEach((item) => {
      return (item.image = Utils.buildFullFileUrl(req, item.image));
    });
    return ApiReponse.success(res, "pack retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};
const createCoinPackController = async (req, res, next) => {
  try {
    const body = req.body;
    if (req.file?.path) {
      body.image = Utils.extractUploadRelativePath(req.file.path);
    } else {
      throw new Error("Image file is missing");
    }
    const data = await CoinPackService.create(body);
    data.image = Utils.buildFullFileUrl(req, data.image);
    return ApiReponse.success(res, "create successfully", data);
  } catch (error) {
    next(error);
  }
};
const updateCoinPackController = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    if (req.file?.path) {
      body.image = Utils.extractUploadRelativePath(req.file.path);
    } else {
      throw new Error("Image file is missing");
    }
    const data = await CoinPackService.update(Number(id), body);
    data.image = Utils.buildFullFileUrl(req, data.image);
    return ApiReponse.success(res, "pack updated ", data);
  } catch (error) {
    next(error);
  }
};
const deleteCoinPackController = async (req, res, next) => {
  try {
    const data = await CoinPackService.delete(Number(req.params.id));
    return ApiReponse.success(res, "deleted successfully", data);
  } catch (error) {
    next(error);
  }
};
const activeCoinPackController = async (req, res, next) => {
  try {
    const data = await CoinPackService.setActive(Number(req.params.id));
    return ApiReponse.success(res, "pack active successfully", data);
  } catch (error) {
    next(error);
  }
};

const inactiveCoinPackController = async (req, res, next) => {
  try {
    const data = await CoinPackService.setInactive(Number(req.params.id));
    return ApiReponse.success(res, "pack inactive successfully", data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoinPacksController,
  createCoinPackController,
  updateCoinPackController,
  deleteCoinPackController,
  activeCoinPackController,
  inactiveCoinPackController,
};
