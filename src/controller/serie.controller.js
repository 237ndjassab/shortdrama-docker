const { ApiReponse } = require("../helpers/response.js");
const { Utils } = require("../helpers/Utils.js");
const { SeriesService } = require("../services/serie.service.js");
const cloudinary = require("../config/cloudinary.config.js");

const createSeriesController = async (req, res, next) => {
  try {
    const body = req.body;
    const creatorId = req.user.id;

    let thumbnailUrl = null;
    let trailerUrl = null;
    let thumbnailPublicId = null;
    let trailerPublicId = null;
    let streamingUrl = null;

    // 🔥 Upload thumbnail
    if (req.files?.thumbnail?.[0]) {
      const uploadResult = await cloudinary.uploader.upload(
        req.files.thumbnail[0].path,
        {
          folder: "series/thumbnails",
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
        },
      );

      thumbnailUrl = uploadResult.secure_url;
      thumbnailPublicId = uploadResult.public_id;
    }

    // 🔥 Upload vidéo (CORRIGÉ)
    if (req.files?.trailerUrl?.[0]) {
      const uploadResult = await cloudinary.uploader.upload(
        req.files.trailerUrl[0].path,
        {
          folder: "series/trailers",
          resource_type: "video",
          // ❌ SUPPRESSION de "transformation: [...]" ici car elle bloquait l'upload synchrone
          eager: [
            {
              streaming_profile: "full_hd",
              format: "m3u8",
            },
            // ✅ Si tu veux aussi une version MP4 optimisée en arrière-plan, ajoute-la ici :
            {
              quality: "auto",
              fetch_format: "auto",
              format: "mp4"
            }
          ],
          eager_async: true, // Libère ton serveur immédiatement
        },
      );

      trailerUrl = uploadResult.secure_url;
      trailerPublicId = uploadResult.public_id;

      // 🎯 URL streaming HLS (CORRIGÉ)
      // Pour l'HLS, il faut explicitement demander le profil de streaming dans l'URL,
      // sinon Cloudinary va tenter de le générer à la volée (synchrone) au premier clic.
      streamingUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: "video",
        transformation: [{ streaming_profile: "full_hd" }],
        format: "m3u8",
      });

      // 🔥 Si pas de thumbnail → générer depuis la vidéo (OK en synchrone pour une image)
      if (!thumbnailUrl) {
        thumbnailUrl = cloudinary.url(uploadResult.public_id, {
          resource_type: "video",
          format: "jpg",
          transformation: [
            { width: 480, crop: "scale" },
            { start_offset: "3" },
          ],
        });
      }
    }

    // Vérification minimale
    if (!body.title || !body.countryOrigin || !body.categoryId) {
      throw new Error(
        "Missing required fields: title, countryOrigin, categoryId",
      );
    }
    body.categoryId = parseInt(body.categoryId);

    // Création DB
    const data = await SeriesService.create({
      ...body,
      creatorId,
      thumbnail: thumbnailUrl,
      trailerUrl,
      trailerPublicId,
      thumbnailPublicId,
    });

    // 🔥 Réponse enrichie pour le front
    return ApiReponse.success(res, "Serie created successfully", {
      ...data,
      thumbnail: thumbnailUrl,
      trailerUrl,
      streamingUrl,
    });
  } catch (error) {
    next(error);
  }
};

const getHomeController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);

    const data = await SeriesService.getHome(userId);

    return ApiReponse.success(res, "Home data fetched successfully", data, 200);
  } catch (error) {
    next(error);
  }
};

const updateSeriesController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const data = await SeriesService.update(id, req.body, userId);
    return ApiReponse.success(res, "series updated", data);
  } catch (error) {
    next(error);
  }
};

const getFullSeriesController = async (req, res, next) => {
  try {
    const seriesId = parseInt(req.params.id);

    const series = await SeriesService.getFullSeries(seriesId);

    if (!series) {
      return ApiReponse.error(res, "Series not found", 404);
    }
    series.creator.avatar_url = Utils.buildFullFileUrl(
      req,
      series.creator.avatar_url,
    );

    return ApiReponse.success(res, "Series full data retrieved", {
      series,
    });
  } catch (error) {
    next(error);
  }
};

const softDeleteSeriesController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = parseInt(req.user.id);

    const data = await SeriesService.softDelete(id, userId);

    return ApiReponse.success(res, "Series soft deleted successfully", data);
  } catch (error) {
    next(error);
  }
};

const rejectedSeriesController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const adminId = parseInt(req.user.id);

    const data = await SeriesService.rejectSerie(id, adminId);

    return ApiReponse.success(res, "Series rejected successfully", data);
  } catch (error) {
    next(error);
  }
};

const publishSeriesController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const data = await SeriesService.publishSerie(id);

    return ApiReponse.success(res, "Series published successfully", data);
  } catch (error) {
    next(error);
  }
};

const hardDeleteSeriesController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = parseInt(req.user.id);

    const data = await SeriesService.hardDelete(id, userId);

    return ApiReponse.success(res, "Series permanently deleted", data);
  } catch (error) {
    next(error);
  }
};

const getMySeriesController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);
    const data = await SeriesService.getByCreator(userId);
    return ApiReponse.success(res, "serie retrieved", data);
  } catch (error) {
    next(error);
  }
};

const getTopEpisodesByCreatorController = async (req, res, next) => {
  try {
    const creatorId = parseInt(req.user.id);

    const episodes = await SeriesService.getTopEpisodesByCreator(creatorId);

    return ApiReponse.success(res, "Top episodes retrieved", episodes);
  } catch (error) {
    next(error);
  }
};

const getMyAdminSeriesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await SeriesService.getSerieByAdminId(userId);
    return ApiReponse.success(res, "serie retrieved", data);
  } catch (error) {
    next(error);
  }
};

const getAllSeriesController = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const data = await SeriesService.getAll();
    return ApiReponse.success(res, "serie retrieved", data);
  } catch (error) {
    next(error);
  }
};

const getSeriesByCategoryController = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const data = await SeriesService.getByCategory(categoryId);
    return ApiReponse.success(res, "retrieved by categories", data);
  } catch (error) {
    next(error);
  }
};

const getSeriesByIdController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = await SeriesService.getById(id);
    data.creator.avatar_url = Utils.buildFullFileUrl(
      req,
      data.creator.avatar_url,
    );
    return ApiReponse.success(res, "retrieved serie by Id", data);
  } catch (error) {
    next(error);
  }
};

const getPaginatedSeriesController = async (req, res, next) => {
  try {
    const { page, limit, search, categoryId, sortBy, order } = req.query;

    const paginated = await SeriesService.getPaginated({
      page,
      limit,
      search,
      categoryId,
      sortBy,
      order,
    });
    paginated.data.forEach((serie) => {
      serie.creator.avatar_url = Utils.buildFullFileUrl(
        req,
        serie.creator.avatar_url,
      );
    });

    return ApiReponse.success(res, "series paginated", paginated);
  } catch (error) {
    next(error);
  }
};

const getMyAdminSeriesPaginateController = async (req, res, next) => {
  try {
    const { page, limit, search, categoryId, sortBy, order } = req.query;
    const userId = req.user.id;
    const paginated = await SeriesService.getSeriePaginateByAdminId({
      page,
      limit,
      search,
      categoryId,
      sortBy,
      order,
      creatorId: userId,
    });
    return ApiReponse.success(res, "serie paginate retrieved", paginated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSeriesController,
  updateSeriesController,
  softDeleteSeriesController,
  hardDeleteSeriesController,
  getMySeriesController,
  getSeriesByCategoryController,
  getAllSeriesController,
  getSeriesByIdController,
  getPaginatedSeriesController,
  getMyAdminSeriesPaginateController,
  getMyAdminSeriesController,
  getFullSeriesController,
  publishSeriesController,
  rejectedSeriesController,
  getHomeController,
  getTopEpisodesByCreatorController,
};
