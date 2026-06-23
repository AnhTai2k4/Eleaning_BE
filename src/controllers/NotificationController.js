const NotificationService = require("../services/NotificationService");

const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const response = await NotificationService.getUserNotifications(userId, limit);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message || e,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    if (!notificationId) {
      return res.status(200).json({
        status: "ERR",
        message: "The notificationId is required",
      });
    }
    const response = await NotificationService.markAsRead(notificationId, userId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message || e,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const response = await NotificationService.markAllAsRead(userId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message || e,
    });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
