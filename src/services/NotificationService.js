const Notification = require("../models/NotificationModel");

// In-memory cache để chống race condition khi 2 request đồng thời (concurrent requests) gọi createNotification ở cùng 1 mili-giây
const recentNotificationKeys = new Map();

const createNotification = async (data) => {
  try {
    if (data && data.recipientId && data.type) {
      const dedupeKey = `${data.recipientId.toString()}_${data.type}_${data.title}_${data.senderId ? data.senderId.toString() : ''}`;
      const now = Date.now();
      const lastCreated = recentNotificationKeys.get(dedupeKey);

      // Nếu vừa bắt đầu tạo hoặc đã tạo trong 30 giây qua, từ chối ngay lập tức (Chống Race Condition)
      if (lastCreated && (now - lastCreated) < 30000) {
        return null;
      }
      recentNotificationKeys.set(dedupeKey, now);

      // Dọn dẹp bộ nhớ định kỳ
      if (recentNotificationKeys.size > 1000) {
        for (const [key, timestamp] of recentNotificationKeys.entries()) {
          if (now - timestamp > 60000) recentNotificationKeys.delete(key);
        }
      }

      // Kiểm tra thêm trong Database
      const timeWindow = new Date(now - 30000);
      const query = {
        recipientId: data.recipientId,
        type: data.type,
        title: data.title,
        createdAt: { $gte: timeWindow }
      };
      if (data.senderId) query.senderId = data.senderId;

      const duplicate = await Notification.findOne(query);
      if (duplicate) {
        return duplicate;
      }
    }

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
