const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/NotificationController");
const { authGeneralMiddleware } = require("../middleware/authMiddleware");

router.get("/get-all", authGeneralMiddleware, NotificationController.getUserNotifications);
router.put("/mark-read/:id", authGeneralMiddleware, NotificationController.markAsRead);
router.put("/mark-all-read", authGeneralMiddleware, NotificationController.markAllAsRead);

module.exports = router;
