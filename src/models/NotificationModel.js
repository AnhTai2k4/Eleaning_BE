const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, required: true }, // VD: 'comment_reply', 'plan_submitted', 'plan_reviewed', 'course_comment'
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetUrl: { type: String }, // Đường dẫn để click vào thông báo sẽ trỏ tới
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
