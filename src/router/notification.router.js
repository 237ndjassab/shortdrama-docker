const express = require("express");
const notificationRouter = express.Router();

const { authenticated } = require("../middleware/authenticated.middleware");

const {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  unreadCountController,
} = require("../controller/notification.controller");

notificationRouter.get(
  "/",
  authenticated,
  getNotificationsController
);

notificationRouter.get(
  "/unread-count",
  authenticated,
  unreadCountController
);

notificationRouter.patch(
  "/:id/read",
  authenticated,
  markAsReadController
);

notificationRouter.patch(
  "/read-all",
  authenticated,
  markAllAsReadController
);

module.exports = {
  notificationRouter,
};