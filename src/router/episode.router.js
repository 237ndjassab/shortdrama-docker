const express = require("express");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const {
  buyEpisodeController,
  getEpisodeByIdController,
  getEpisodeBySeasonController,
  createEpisodeController,
  updateEpisodeController,
  deleteEpisodeController,
  getEpisodeFeedController,
  incrementViewController,
  isEpisodeLiked,
  saveProgressController,
  getContinueWatchingController,
  getAllHistiroyController
} = require("../controller/episode.controller.js");
const multer = require("multer");
const { authorize } = require("../middleware/authorize.middleware.js");
const { diskStorage } = require("../config/multer.config.js");
const upload = multer({ storage: diskStorage, preservePath: false });
const EpisodeRouter = express.Router();

//achat d'episodes
//** gerer le creatorStats et le wallet du creator */
EpisodeRouter.post(
  "/buy/:episodeId",
  authenticated,
  authorize("EPISODE:BUY"),
  buyEpisodeController,
);

EpisodeRouter.post(
  "/episode/history",
  authenticated,
  saveProgressController,
);

//PUBLIC
//obtenir tous les episodes d'une saison en particulier
//** incrementer aussi les vues du creator */
EpisodeRouter.put(
  "/:episodeId/view",
  authenticated,
  incrementViewController,
);

EpisodeRouter.get(
  "/season/:seasonId",
  authenticated,
  getEpisodeBySeasonController,
);

//** ? */
EpisodeRouter.get(
  "/:id/is-liked",
  authenticated,
  isEpisodeLiked ,
);
//** ? */


//obtenir les les episodes dans la section pour vous
// FEED (TikTok style)
EpisodeRouter.get(
  "/feed",
  authenticated,
  getEpisodeFeedController
);

EpisodeRouter.get(
  "/continue-watching",
  authenticated,
  getContinueWatchingController
);

EpisodeRouter.get(
  "/All-History",
  authenticated,
  getAllHistiroyController
);

//obtenir un episode par id
EpisodeRouter.get("/:id", authenticated, getEpisodeByIdController);



//CREATOR
//route pour la creation d'un episode
EpisodeRouter.post(
  "/",
  authenticated,               // 1. Est-ce qu'il est connecté ?
  authorize("EPISODE:CREATE"), // 2. A-t-il les droits ?
  upload.single("video"),      // 3. OK, on accepte son gros fichier
  createEpisodeController,
);

EpisodeRouter.put(
  "/",
  authenticated,
  authorize("EPISODE:UPDATE"),
  updateEpisodeController,
); //authorize("EPISODE:UPDATE"),

//suppression d'un episode
EpisodeRouter.delete(
  "/:id",
  authenticated,
  authorize("EPISODE:DELETE"),
  deleteEpisodeController,
);

module.exports = { EpisodeRouter };
