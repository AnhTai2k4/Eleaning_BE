const { Goal, DailyAction, WeeklySummary } = require('../models/PlanModel');

// ======================== GOAL (MỤC TIÊU THÁNG) ========================

const createOrUpdateGoal = async (req, res) => {
  try {
    const { studentId, month, year, goals, status } = req.body;
    
    let goal = await Goal.findOne({ studentId, month, year });
    if (goal) {
      goal.goals = goals;
      goal.status = status || goal.status;
      await goal.save();
    } else {
      goal = await Goal.create({ studentId, month, year, goals, status });
    }
    
    res.status(200).json({ status: 'OK', data: goal });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

const getGoal = async (req, res) => {
  try {
    const { studentId, month, year } = req.query;
    const goal = await Goal.findOne({ studentId, month: Number(month), year: Number(year) });
    res.status(200).json({ status: 'OK', data: goal });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// Mentor nhận xét mục tiêu
const reviewGoal = async (req, res) => {
  try {
    const { goalId, mentorComment } = req.body;
    const goal = await Goal.findByIdAndUpdate(goalId, {
      mentorComment,
      mentorCommentAt: new Date(),
      status: 'reviewed'
    }, { new: true });
    res.status(200).json({ status: 'OK', data: goal });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// ======================== DAILY ACTION (HÀNH ĐỘNG NGÀY) ========================

const createOrUpdateDailyAction = async (req, res) => {
  try {
    const { studentId, date, tasks, reflection, selfScore, status } = req.body;
    const dateOnly = new Date(date).toISOString().split('T')[0]; // Lấy ngày, bỏ giờ

    let action = await DailyAction.findOne({
      studentId,
      date: { $gte: new Date(dateOnly), $lt: new Date(new Date(dateOnly).getTime() + 86400000) }
    });

    if (action) {
      action.tasks = tasks;
      action.reflection = reflection;
      action.selfScore = selfScore;
      action.status = status || action.status;
      await action.save();
    } else {
      action = await DailyAction.create({ studentId, date: new Date(dateOnly), tasks, reflection, selfScore, status });
    }

    res.status(200).json({ status: 'OK', data: action });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

const getDailyAction = async (req, res) => {
  try {
    const { studentId, date } = req.query;
    const dateOnly = new Date(date).toISOString().split('T')[0];
    const action = await DailyAction.findOne({
      studentId,
      date: { $gte: new Date(dateOnly), $lt: new Date(new Date(dateOnly).getTime() + 86400000) }
    });
    res.status(200).json({ status: 'OK', data: action });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// Lấy tất cả daily actions trong 1 tuần (phục vụ cho Tổng kết tuần)
const getDailyActionsByWeek = async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.query;
    const actions = await DailyAction.find({
      studentId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ date: 1 });
    res.status(200).json({ status: 'OK', data: actions });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// ======================== WEEKLY SUMMARY (TỔNG KẾT TUẦN) ========================

const createOrUpdateWeeklySummary = async (req, res) => {
  try {
    const { studentId, weekNumber, year, totalExpectedHours, totalActualHours, achievementRate, studentReflection, status } = req.body;

    let summary = await WeeklySummary.findOne({ studentId, weekNumber, year });
    if (summary) {
      summary.totalExpectedHours = totalExpectedHours;
      summary.totalActualHours = totalActualHours;
      summary.achievementRate = achievementRate;
      summary.studentReflection = studentReflection;
      summary.status = status || summary.status;
      await summary.save();
    } else {
      summary = await WeeklySummary.create({ studentId, weekNumber, year, totalExpectedHours, totalActualHours, achievementRate, studentReflection, status });
    }

    res.status(200).json({ status: 'OK', data: summary });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

const getWeeklySummary = async (req, res) => {
  try {
    const { studentId, weekNumber, year } = req.query;
    const summary = await WeeklySummary.findOne({ studentId, weekNumber: Number(weekNumber), year: Number(year) });
    res.status(200).json({ status: 'OK', data: summary });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// Mentor chấm kế hoạch ngày
const reviewDailyAction = async (req, res) => {
  try {
    const { actionId, teacherComment, teacherScore } = req.body;
    const action = await DailyAction.findByIdAndUpdate(actionId, {
      teacherComment,
      teacherScore,
      teacherCommentAt: new Date(),
      status: 'reviewed'
    }, { new: true });
    res.status(200).json({ status: 'OK', data: action });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// Giáo viên lấy các kế hoạch ngày của học sinh
const getDailyActionsForTeacher = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['submitted', 'reviewed'] };
    }
    const actions = await DailyAction.find(filter)
      .populate('studentId', 'name username email')
      .sort({ updatedAt: -1 });
    res.status(200).json({ status: 'OK', data: actions });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// Mentor chấm tổng kết tuần
const reviewWeeklySummary = async (req, res) => {
  try {
    const { summaryId, teacherComment, teacherScore } = req.body;
    const summary = await WeeklySummary.findByIdAndUpdate(summaryId, {
      teacherComment,
      teacherScore,
      teacherCommentAt: new Date(),
      status: 'reviewed'
    }, { new: true });
    res.status(200).json({ status: 'OK', data: summary });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

module.exports = {
  createOrUpdateGoal,
  getGoal,
  reviewGoal,
  createOrUpdateDailyAction,
  getDailyAction,
  getDailyActionsByWeek,
  reviewDailyAction,
  getDailyActionsForTeacher,
  createOrUpdateWeeklySummary,
  getWeeklySummary,
  reviewWeeklySummary,
};
