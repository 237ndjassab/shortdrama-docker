const { ApiReponse } = require("../helpers/response.js");
const { LikeService } = require("../services/like.service.js");

const toggleLikeController = async (req, res, next) => {
  const userId = parseInt(req.user.id);
  const episodeId = parseInt(req.params.id);

  try {
    const result = await LikeService.toggleLike(userId, episodeId);
    console.log("result:", result);
    if(result.liked){
    return ApiReponse.success(res, "episode has been liked", result, 200);
    }else{
    return ApiReponse.success(res, "episode has been unliked", result, 200);
    }
  } catch (error) {
    next(error);
  }
};
module.exports = { toggleLikeController };
