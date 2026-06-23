const Notification = require("../models/NotificationModel");

const createNotification = async (data) => {
  try {
    const newNotification = await Notification.create(data);
    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

const getUserNotifications = async (userId, limit = 20) => {
  try {
    const notifications = await Notification.find({ recipientId: userId })
      .populate("senderId", "name avatar username")
      .sort({ createdAt: -1 })
      .limit(limit);
    return {
      status: "OK",
      data: notifications,
    };
  } catch (error) {
    throw error;
  }
};

const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { isRead: true },
      { new: true }
    );
    return {
      status: "OK",
      data: notification,
    };
  } catch (error) {
    throw error;
  }
};

const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );
    return {
      status: "OK",
      message: "All notifications marked as read",
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
