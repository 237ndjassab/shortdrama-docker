const express = require("express");
const creatorRouter = express.Router();
const multer = require("multer");

const { authenticated } = require("../middleware/authenticated.middleware.js");
const { authorize } = require("../middleware/authorize.middleware.js");
const { diskStorage } = require("../config/multer.config.js");
const { requestCreatorController, getAllCreatorRequestsController, approveCreatorRequestController, rejectCreatorRequestController } = require("../controller/creator.controller.js");
const upload = multer({ storage: diskStorage, preservePath: false });

creatorRouter.post('/request', authenticated, requestCreatorController);

creatorRouter.get('/admin/requests', authenticated, getAllCreatorRequestsController); // authorize('CREATOR:REVIEW'),

// creatorRouter.get('/admin/requests', authenticated, getAllCreatorRequestsController); // authorize('CREATOR:REVIEW'),

creatorRouter.put('/admin/requests/approve/:id', authenticated, approveCreatorRequestController); //authorize('CREATOR:REVIEW'),

creatorRouter.put('/admin/requests/reject/:id', authenticated, rejectCreatorRequestController); //authorize('CREATOR:REVIEW'),

module.exports = {
  creatorRouter,
};
