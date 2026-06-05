const express = require('express');
const router = express.Router();
const PlanController = require('../controllers/PlanController');

// ===== MỤC TIÊU THÁNG =====
router.post('/goal', PlanController.createOrUpdateGoal);
router.get('/goal', PlanController.getGoal);
router.put('/goal/review', PlanController.reviewGoal);

// ===== HÀNH ĐỘNG HÀNG NGÀY =====
router.post('/daily', PlanController.createOrUpdateDailyAction);
router.get('/daily', PlanController.getDailyAction);
router.get('/daily/week', PlanController.getDailyActionsByWeek);
router.put('/daily/review', PlanController.reviewDailyAction);
router.get('/daily/teacher', PlanController.getDailyActionsForTeacher);
router.post('/daily/ai-comment', PlanController.generateAIComment);

// ===== TỔNG KẾT TUẦN =====
router.post('/summary', PlanController.createOrUpdateWeeklySummary);
router.get('/summary', PlanController.getWeeklySummary);
router.put('/summary/review', PlanController.reviewWeeklySummary);

module.exports = router;
