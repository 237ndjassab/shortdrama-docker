const express = require("express");
const {
  createSlideController,
  deleteSlideController,
  getAllSlidesController,
  getOneSlideController,
  updateSlideController,
  getAllSlidesForAdminController,
} = require("../controller/slide.controller.js");

const { authenticated } = require("../middleware/authenticated.middleware.js");
const multer = require("multer");
const { diskStorage } = require("../config/multer.config.js");
const upload = multer({ storage: diskStorage, preservePath: false });

const slideRouter = express.Router();

slideRouter.post(
  "/",
  authenticated,
  //   authorize("SLIDES:CREATE"),
  upload.single("imageUrl"),
  createSlideController,
);
slideRouter.get("/", authenticated, getAllSlidesController);
slideRouter.get("/admin", authenticated, getAllSlidesForAdminController);
slideRouter.get("/:id", getOneSlideController);
slideRouter.put("/:id", updateSlideController);
slideRouter.delete("/:id", deleteSlideController);

module.exports = { slideRouter };
