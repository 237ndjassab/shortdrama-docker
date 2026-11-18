
const { ApiReponse } = require("../helpers/response");
const { NotificationService } = require("../services/notifications.service.js");

const getNotificationsController = async (req, res, next) => {
  try {
    const notifications = await NotificationService.getByUser(req.user.id);

    return ApiReponse.success(
      res,
      "Notifications fetched",
      notifications
    );
  } catch (error) {
    next(error);
  }
};

const markAsReadController = async (req, res, next) => {
  try {
    const notification = await NotificationService.markAsRead(
      Number(req.params.id),
      req.user.id
    );

    return ApiReponse.success(
      res,
      "Notification updated",
      notification
    );
  } catch (error) {
    next(error);
  }
};

const markAllAsReadController = async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);

    return ApiReponse.success(
      res,
      "Notifications updated",
      null
    );
  } catch (error) {
    next(error);
  }
};

const unreadCountController = async (req, res, next) => {
  try {
    const count = await NotificationService.unreadCount(req.user.id);

    return ApiReponse.success(
      res,
      "Unread notifications",
      {
        count,
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  unreadCountController,
};