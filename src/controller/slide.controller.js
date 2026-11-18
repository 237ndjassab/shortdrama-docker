const { ApiReponse } = require("../helpers/response.js");

const SlideService = require("../services/slide.service");
const cloudinary = require("../config/cloudinary.config.js");

const createSlideController = async (req, res, next) => {
  try {
    const body = req.body;

    let imageUrl = null;
    let imagePublicId = null;

    // Upload image
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "slides/images",
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      });

      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    // Validation
    if (!body.title) {
      throw new Error("Title is required");
    }

    // Conversions
    const slideData = {
      ...body,

      serieId: body.serieId ? Number(body.serieId) : null,

      episodeId: body.episodeId ? Number(body.episodeId) : null,

      order: body.order ? Number(body.order) : 0,

      isActive: req.body.isActive === "true" || req.body.isActive === true,
      isFeatured:
        req.body.isFeatured === "true" || req.body.isFeatured === true,

      imageUrl,
      imagePublicId,
    };

    const slide = await SlideService.create(slideData);

    return ApiReponse.success(res, "Slide created successfully", slide);
  } catch (error) {
    next(error);
  }
};

const getAllSlidesController = async (req, res, next) => {
  try {
    const slides = await SlideService.getAll();

    return ApiReponse.success(res, "Slides retrieved successfully", slides);
  } catch (error) {
    next(error);
  }
};

const getAllSlidesForAdminController = async (req, res, next) => {
  try {
    const slides = await SlideService.getAllForAdmin();

    return ApiReponse.success(res, "Slides retrieved successfully", slides);
  } catch (error) {
    next(error);
  }
};

const getOneSlideController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const slide = await SlideService.getOne(id);

    return ApiReponse.success(res, "Slide retrieved successfully", slide);
  } catch (error) {
    next(error);
  }
};

const updateSlideController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = {
      ...req.body,

      serieId: req.body.serieId ? Number(req.body.serieId) : null,

      episodeId: req.body.episodeId ? Number(req.body.episodeId) : null,

      order: req.body.order ? Number(req.body.order) : 0,

      isActive: req.body.isActive === "true",

      isFeatured: req.body.isFeatured === "true",
    };

    const slide = await SlideService.update(id, data);

    return ApiReponse.success(res, "Slide updated successfully", slide);
  } catch (error) {
    next(error);
  }
};

const deleteSlideController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const slide = await SlideService.getOne(id);
    if (slide?.imagePublicId) {
      await cloudinary.uploader.destroy(slide.imagePublicId);
    }

    await SlideService.remove(id);

    return ApiReponse.success(res, "Slide deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSlideController,
  getAllSlidesController,
  getOneSlideController,
  updateSlideController,
  deleteSlideController,
  getAllSlidesForAdminController,
};
