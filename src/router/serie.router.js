const express = require("express");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const {
  createSeriesController,
  updateSeriesController,
  deleteSeriesController,
  getMySeriesController,
  getSeriesByCategoryController,
  getAllSeriesController,
  getSeriesByIdController,
  getPaginatedSeriesController,
  getMyAdminSeriesController,
  getMyAdminSeriesPaginateController,
  getFullSeriesController,
  getHomeController,
  softDeleteSeriesController,
  hardDeleteSeriesController,
  publishSeriesController,
  rejectedSeriesController,
  getTopEpisodesByCreatorController,
} = require("../controller/serie.controller.js");
const { validate } = require("../middleware/validate.middleware.js");
const { categorieSchema } = require("../validation/categorie.validation.js");
const { authorize } = require("../middleware/authorize.middleware.js");
const multer = require("multer");
const { diskStorage } = require("../config/multer.config.js");
const upload = multer({ storage: diskStorage, preservePath: false });
const serieRouter = express.Router();

serieRouter.post(
  "/",
  authenticated,
  authorize("SERIES:CREATE"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "trailerUrl", maxCount: 1 },
  ]),
  createSeriesController,
); //authorize(SERIES:CREATE)

serieRouter.put(
  "/:id",
  authenticated,
  authorize("SERIES:UPDATE"),
  validate(categorieSchema),
  updateSeriesController,
); //authorize(SERIES:UPDATE)

serieRouter.get("/", authenticated, getAllSeriesController);
serieRouter.get("/paginate", authenticated, getPaginatedSeriesController);

serieRouter.get("/home", authenticated, getHomeController);
// serieRouter.get("/trending", authenticated, getPaginatedSeriesController);
// serieRouter.get("/featured", authenticated, getPaginatedSeriesController);
// serieRouter.get("/latest", authenticated, getPaginatedSeriesController);
// serieRouter.get("/recommended", authenticated, getPaginatedSeriesController);
// serieRouter.get("/home", authenticated, getPaginatedSeriesController);

//** ici on va retourner les informations du creatorProfile */
serieRouter.get(
  "/me",
  authenticated,
  authorize("SERIES:ME"),
  getMySeriesController,
); //authorize(SERIES:ME)
serieRouter.get(
  "/top-episodes/me",
  authenticated,
  authorize("SERIES:ME"),
  getTopEpisodesByCreatorController,
); //authorize(SERIES:ME)

serieRouter.get(
  "/admin",
  authenticated,
  authorize("SERIES:ME"),
  getMyAdminSeriesController,
); //authorize(SERIES:ME)

serieRouter.get(
  "/admin/paginate",
  authenticated,
  authorize("SERIES:ME"),
  getMyAdminSeriesPaginateController,
); //authorize(SERIES:ME)

serieRouter.get("/:id", authenticated, getSeriesByIdController);

serieRouter.patch(
  "/:id/soft-delete",
  authenticated,
  authorize("SERIES:DELETE"),
  softDeleteSeriesController,
);

serieRouter.patch(
  "/:id/rejected",
  authenticated,
  authorize("SERIES:DELETE"),
  rejectedSeriesController,
);

serieRouter.patch(
  "/:id/publish",
  authenticated,
  authorize("SERIES:DELETE"),
  publishSeriesController,
);

serieRouter.delete(
  "/:id/hard-delete",
  authenticated,
  authorize("SERIES:HARD_DELETE"),
  hardDeleteSeriesController,
);

serieRouter.get("/:id/full", authenticated, getFullSeriesController);

serieRouter.get("/category/:id", authenticated, getSeriesByCategoryController);

module.exports = { serieRouter };
