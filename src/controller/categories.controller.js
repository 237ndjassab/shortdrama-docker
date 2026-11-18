const { ApiReponse } = require("../helpers/response.js");
const { CategoryService } = require("../services/category.service.js");

const getAllCategoriesController = async (req, res, next) => {
  try {
    const data = await CategoryService.getAll();
    return ApiReponse.success(res, "Category retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};
const getAllCategoriesForAdminController = async (req, res, next) => {
  try {
    const data = await CategoryService.getAllForAdmin();
    return ApiReponse.success(res, "Category retrieved successfully", data);
  } catch (error) {
    next(error);
  }
};

const getCategoriesByIdController = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = await CategoryService.getById(id);
    return ApiReponse.success(
      res,
      `category ${id} retrieved successfully`,
      data,
    );
  } catch (error) {
    next(error);
  }
};

const createCategoriesController = async (req, res, next) => {
  try {
    const body = req.body;
    const data = await CategoryService.create(body);
    return ApiReponse.success(res, "category create successfully", data);
  } catch (error) {
    next(error);
  }
};

const updateCategoriesController = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const data = await CategoryService.update(id, body);
    return ApiReponse.success(res, "category updated successfully", data);
  } catch (error) {
    next(error);
  }
};

const deleteCategoriesController = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = await CategoryService.delete(id);
    return ApiReponse.success(res, "category deleted ", data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategoriesController,
  getCategoriesByIdController,
  createCategoriesController,
  updateCategoriesController,
  deleteCategoriesController,
  getAllCategoriesForAdminController
};
