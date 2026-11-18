const express = require("express");
const { authenticated } = require("../middleware/authenticated.middleware.js");
const analyticRouter = express.Router();

analyticRouter.get("/top-episodes/me", authenticated, getTopEpisodesMeController);

module.exports = {analyticRouter}