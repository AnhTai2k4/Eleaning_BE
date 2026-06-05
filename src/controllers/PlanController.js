const { Goal, DailyAction, WeeklySummary } = require('../models/PlanModel');
const axios = require('axios');

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

const generateAIComment = async (req, res) => {
  try {
    const { tasks, reflection, selfScore, date } = req.body;
    const taskCount = tasks?.length || 0;
    const totalActualTime = tasks?.reduce((sum, t) => sum + (Number(t.actualTime) || 0), 0) || 0;
    const totalPlannedTime = tasks?.reduce((sum, t) => sum + (Number(t.time) || 0), 0) || 0;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback to local rule-based comment if no API key is provided
      let fallbackComment = `Nhận xét kế hoạch ngày ${new Date(date).toLocaleDateString('vi-VN')}:\n`;
      fallbackComment += `- Học sinh hoàn thành ${taskCount} công việc chính.\n`;
      fallbackComment += `- Học tập thực tế: ${totalActualTime} giờ (dự kiến: ${totalPlannedTime} giờ).\n`;
      if (totalActualTime >= totalPlannedTime) {
        fallbackComment += `- Hoàn thành rất tốt mục tiêu thời gian đã tự đề xuất. `;
      } else {
        fallbackComment += `- Thời gian học thực tế còn ít hơn dự kiến, em cần chú ý quản lý thời gian tập trung hơn. `;
      }
      if (selfScore >= 8) {
        fallbackComment += `Tinh thần tự giác cao (${selfScore}/10). `;
      }
      if (reflection) {
        fallbackComment += `Rút kinh nghiệm tốt: "${reflection}".`;
      }
      return res.status(200).json({ status: 'OK', data: fallbackComment });
    }

    const prompt = `Bạn là một trợ lý AI giáo dục thông thái (AI Co-pilot). Hãy nhận xét kế hoạch tự học trong ngày của học sinh bằng tiếng Việt ngắn gọn trong 3-4 dòng.
Thông tin học sinh nộp:
- Tổng số công việc tự học dự kiến: ${taskCount} công việc.
- Tổng thời gian tự học thực tế: ${totalActualTime} giờ (dự kiến ban đầu: ${totalPlannedTime} giờ).
- Học sinh tự đánh giá tinh thần kỷ luật: ${selfScore || 10}/10 điểm.
- Rút kinh nghiệm của học sinh: "${reflection || 'Học sinh không ghi chú gì thêm'}"

Danh sách các công việc cụ thể:
${(tasks || []).map((t, i) => `${i+1}. Khía cạnh: ${t.aspect} | Dự kiến: ${t.time}h | Thực tế: ${t.actualTime}h | Hành động: ${t.action}`).join('\n')}

Hãy đưa ra lời khuyên thiết thực, khen ngợi nếu học sinh tự giác và nhắc nhở chân thành nếu học sinh chưa đạt thời gian học dự kiến. Nhận xét cần ngắn gọn, súc tích và có thái độ khuyến khích học tập.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    const response = await axios.post(geminiUrl, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ status: 'OK', data: aiText.trim() });
  } catch (err) {
    if (err.response) {
      console.error('Gemini API Error Response Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Gemini API Error:', err.message);
    }
    res.status(500).json({ status: 'ERR', message: err.message, errorDetails: err.response?.data });
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
  generateAIComment,
};
