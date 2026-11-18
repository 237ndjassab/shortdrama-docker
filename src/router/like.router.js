const express = require("express");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const { toggleLikeController } = require("../controller/like.controller.js");

const likeRouter = express.Router();

likeRouter.post("/episodes/:id", authenticated, toggleLikeController);

module.exports = { likeRouter };
