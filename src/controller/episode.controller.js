const { ApiReponse } = require("../helpers/response.js");
const { prisma } = require("../model/index.js");
const { EpisodeService } = require("../services/episode.service.js");
const cloudinary = require("../config/cloudinary.config.js");
const { Utils } = require("../helpers/Utils.js");

const buyEpisodeController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);
    const episodeId = parseInt(req.params.episodeId);
    const result = await EpisodeService.buyEpisode(
      Number(userId),
      Number(episodeId),
    );
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId,
      },
      select: {
        balanceCoins: true,
        totalSpent: true,
      },
    });
    return ApiReponse.success(res, "Episode purchased successfully", {
      result,
      wallet,
      "episode Acheté": episodeId,
    });
  } catch (error) {
    next(error);
  }
};

const saveProgressController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);
    const { episodeId, watchedDuration, progressPercent, completed } = req.body;
    const history = await EpisodeService.saveProgress({
      userId,
      episodeId,
      watchedDuration,
      progressPercent,
      completed,
    });
    return ApiReponse.success(res, "Progress saved successfully", history);
  } catch (error) {
    next(error);
  }
};

const getContinueWatchingController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);
    const data = await EpisodeService.getContinueWatching(userId);
    return ApiReponse.success(
      res,
      "Continue watching episodes retrieved",
      data,
    );
  } catch (error) {
    next(error);
  }
};

const getAllHistiroyController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);
    const data = await EpisodeService.getAllHistory(userId);
    return ApiReponse.success(res, "All Historics episodes retrieved", data);
  } catch (error) {
    next(error);
  }
};

const createEpisodeController = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);
    const { title, seasonId, description, priceCoins } = req.body;

    // 1. Validation immédiate (Évite les uploads inutiles)
    if (!title || !seasonId) {
      throw new Error("Missing required fields: title and seasonId are required");
    }

    if (!req.file) {
      throw new Error("Video file is required");
    }

    // 2. 🔥 Upload Cloudinary (CORRIGÉ - Plus de transformation bloquante)
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "episodes/videos",
      resource_type: "video",
      eager: [
        {
          streaming_profile: "full_hd",
          format: "m3u8",
        },
        // Si tu as besoin d'une version MP4 classique optimisée en arrière-plan :
        { quality: "auto", fetch_format: "auto", format: "mp4" }
      ],
      eager_async: true, // Traitement asynchrone pour les gros fichiers
    });

    // 3. 🎯 URLs importantes
    const videoUrl = uploadResult.secure_url;

    const streamingUrl = cloudinary.url(uploadResult.public_id, {
      resource_type: "video",
      format: "m3u8",
      transformation: [{ streaming_profile: "full_hd" }],
    });

    // 4. 🖼️ Thumbnail auto (Généré à la volée depuis la vidéo)
    const thumbnail = cloudinary.url(uploadResult.public_id, {
      resource_type: "video",
      format: "jpg",
      transformation: [{ width: 480, crop: "scale" }, { start_offset: "3" }],
    });

    // 5. ⏱️ Durée
    const duration = Math.floor(uploadResult.duration || 0);

    // 6. Enregistrement en base de données via le Service
    const data = await EpisodeService.create({
      title,
      description,
      priceCoins,
      seasonId,
      userId,
      videoUrl,
      streamingUrl,
      thumbnail,
      duration,
      videoPublicId: uploadResult.public_id,
    });

    return ApiReponse.success(res, "Episode created successfully", {
      ...data,
      streamingUrl,
      thumbnail,
    });
  } catch (error) {
    next(error);
  }
};
const getEpisodeBySeasonController = async (req, res, next) => {
  try {
    const seasonId = parseInt(req.params.seasonId);
    const userId = parseInt(req.user.id);

    const data = await EpisodeService.getBySeason(seasonId, userId);
    data.map(
      (ep) =>
        (ep.creator.avatar_url = Utils.buildFullFileUrl(
          req,
          ep.creator.avatar_url,
        )),
    );

    return ApiReponse.success(res, "episode get by season", data);
  } catch (error) {
    next(error);
  }
};

const isEpisodeLiked = async (req, res, next) => {
  const userId = parseInt(req.user.id);
  const episodeId = parseInt(req.params.id);

  try {
    const like = await prisma.like.findUnique({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },
    });

    return ApiReponse.success(
      res,
      "Episode's retrieved",
      { liked: !!like },
      200,
    );
  } catch (error) {
    next(error);
  }
};

const incrementViewController = async (req, res, next) => {
  try {
    const episodeId = parseInt(req.params.episodeId);
    // console.log(typeof(episodeId))
    const data = await EpisodeService.incrementViews(episodeId);
    return ApiReponse.success(res, "view updated", data);
  } catch (error) {
    next(error);
  }
};

const getEpisodeFeedController = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const userId = parseInt(req.user.id);

    const episodes = await EpisodeService.getFeed({ page, limit, userId });
    console.log("episodes: ", episodes);
    if (episodes) {
      episodes.map(
        (ep) =>
          (ep.creator.avatar_url = Utils.buildFullFileUrl(
            req,
            ep.creator.avatar_url,
          )),
      );
    }

    return ApiReponse.success(res, "episode retrieved by feed", {
      episodes,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

const getEpisodeByIdController = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const data = await EpisodeService.getById(id);

    return ApiReponse.success(res, "episode get by id", data);
  } catch (error) {
    next(error);
  }
};
const updateEpisodeController = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.id;

    const data = await EpisodeService.update(id, req.body, userId);

    return ApiReponse.success(res, "episode update", data);
  } catch (error) {
    next(error);
  }
};
const deleteEpisodeController = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.user.id);

    const data = await EpisodeService.delete(id, userId);

    return ApiReponse.success(res, "Episode deleted", data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  buyEpisodeController,
  getEpisodeBySeasonController,
  getEpisodeByIdController,
  createEpisodeController,
  updateEpisodeController,
  deleteEpisodeController,
  getEpisodeFeedController,
  incrementViewController,
  isEpisodeLiked,
  saveProgressController,
  getContinueWatchingController,
  getAllHistiroyController,
};
