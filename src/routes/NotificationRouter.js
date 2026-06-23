const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/NotificationController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/get-all", authMiddleware, NotificationController.getUserNotifications);
router.put("/mark-read/:id", authMiddleware, NotificationController.markAsRead);
router.put("/mark-all-read", authMiddleware, NotificationController.markAllAsRead);

module.exports = router;
