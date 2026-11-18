const express = require("express");
const {
  getAllCategoriesController,
  getCategoriesByIdController,
  createCategoriesController,
  updateCategoriesController,
  deleteCategoriesController,
  getAllCategoriesForAdminController,
} = require("../controller/categories.controller.js");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const { validate } = require("../middleware/validate.middleware.js");
const { categorieSchema } = require("../validation/categorie.validation.js");
const { authorize } = require("../middleware/authorize.middleware.js");
const categoriesRouter = express.Router();

//PUBLIC ROUTES
categoriesRouter.get("/", getAllCategoriesController);
categoriesRouter.get(
  "/admin",
  authenticated,
  authorize("CATEGORY:GETALL"),
  getAllCategoriesForAdminController,
);
categoriesRouter.get("/:id", getCategoriesByIdController);
// categoriesRouter.get('/paginate', paginateCategories);

//ADMIN ROUTES

categoriesRouter.post(
  "/",
  authenticated,
  authorize("CATEGORY:CREATE"),
  validate(categorieSchema),
  createCategoriesController,
); //authorize("CATEGORY:CREATE")

categoriesRouter.put(
  "/:id",
  authenticated,
  authorize("CATEGORY:UPDATE"),
  validate(categorieSchema),
  updateCategoriesController,
); //authorize("CATEGORY:UPDATE")
categoriesRouter.delete(
  "/:id",
  authenticated,
  authorize("CATEGORY:DELETE"),
  deleteCategoriesController,
); //authorize("CATEGORY:DELETE")

module.exports = {
  categoriesRouter,
};
