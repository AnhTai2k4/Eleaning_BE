const { Goal, DailyAction, WeeklySummary } = require('../models/PlanModel');
const axios = require('axios');
const NotificationService = require('../services/NotificationService');
const User = require('../models/UserModel');

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
      const isNewSubmission = action.status !== 'submitted' && status === 'submitted';
      action.tasks = tasks;
      action.reflection = reflection;
      action.selfScore = selfScore;
      action.status = status || action.status;
      await action.save();
      
      if (isNewSubmission) {
        const student = await User.findById(studentId);
        const teachers = await User.find({ $or: [{ isTeacher: true }, { isAdmin: true }] });
        for (const teacher of teachers) {
          await NotificationService.createNotification({
            recipientId: teacher._id,
            senderId: studentId,
            type: "plan_submitted",
            title: "Học sinh nộp kế hoạch mới",
            message: `Học sinh ${student?.name || student?.username || ""} vừa nộp kế hoạch ngày.`,
            targetUrl: `/quan-tri`
          });
        }
      }
    } else {
      action = await DailyAction.create({ studentId, date: new Date(dateOnly), tasks, reflection, selfScore, status });
      if (status === 'submitted') {
        const student = await User.findById(studentId);
        const teachers = await User.find({ $or: [{ isTeacher: true }, { isAdmin: true }] });
        for (const teacher of teachers) {
          await NotificationService.createNotification({
            recipientId: teacher._id,
            senderId: studentId,
            type: "plan_submitted",
            title: "Học sinh nộp kế hoạch mới",
            message: `Học sinh ${student?.name || student?.username || ""} vừa nộp kế hoạch ngày.`,
            targetUrl: `/quan-tri`
          });
        }
      }
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
    
    if (action) {
      await NotificationService.createNotification({
        recipientId: action.studentId,
        type: "plan_reviewed",
        title: "Giáo viên đã nhận xét kế hoạch của bạn",
        message: `Kế hoạch ngày của bạn đã được giáo viên nhận xét và chấm ${teacherScore} điểm.`,
        targetUrl: `/so-tay`
      });
    }

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

    // Hàm tạo nhận xét dự phòng thông minh (Rule-based Fallback)
    const getFallbackComment = () => {
      let fallbackComment = `Nhận xét kế hoạch ngày ${new Date(date || Date.now()).toLocaleDateString('vi-VN')}:\n`;
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
      return fallbackComment.trim();
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ status: 'OK', data: getFallbackComment() });
    }

    const prompt = `Bạn là một trợ lý AI giáo dục thông thái (AI Co-pilot). Hãy nhận xét kế hoạch tự học trong ngày của học sinh bằng tiếng Việt ngắn gọn trong 3-4 dòng, hãy nhận xét như 1 giáo viên nghiêm túc, ít có câu cảm thán, chỉ nêu điểm mạnh, điểm yếu và đưa ra lời khuyên cho học sinh.
Thông tin học sinh nộp:
- Tổng số công việc tự học dự kiến: ${taskCount} công việc.
- Tổng thời gian tự học thực tế: ${totalActualTime} giờ (dự kiến ban đầu: ${totalPlannedTime} giờ).
- Học sinh tự đánh giá tinh thần kỷ luật: ${selfScore || 10}/10 điểm.
- Rút kinh nghiệm của học sinh: "${reflection || 'Học sinh không ghi chú gì thêm'}"

Danh sách các công việc cụ thể:
${(tasks || []).map((t, i) => `${i+1}. Khía cạnh: ${t.aspect} | Dự kiến: ${t.time}h | Thực tế: ${t.actualTime}h | Hành động: ${t.action}`).join('\n')}

Hãy đưa ra lời khuyên thiết thực, khen ngợi nếu học sinh tự giác và nhắc nhở chân thành nếu học sinh chưa đạt thời gian học dự kiến. Nhận xét cần ngắn gọn, súc tích và có thái độ khuyến khích học tập.`;

    // Danh sách các model Gemini theo thứ tự ưu tiên & cơ chế Retry nhanh (chống lỗi 503 High Demand & Timeout)
    const modelsToTry = [
      'gemini-2.5-flash-lite',
      'gemini-1.5-flash'
    ];

    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
      
      // Thử tối đa 2 lần cho mỗi model với thời gian chờ ngắn (4.5 giây/lần) để đảm bảo không bị timeout ở Frontend
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await axios.post(geminiUrl, {
            contents: [{ parts: [{ text: prompt }] }]
          }, { timeout: 4500 }); // timeout 4.5 giây cho mỗi request AI

          const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (aiText.trim()) {
            return res.status(200).json({ status: 'OK', data: aiText.trim() });
          }
        } catch (err) {
          const statusCode = err.response?.status || 500;
          console.warn(`[GEMINI RETRY] Model ${modelName} (Attempt ${attempt}/2) failed with status: ${statusCode || err.code}`);
          // Nếu lỗi 503 (Overloaded) hoặc 429 (Rate Limit), đợi 500ms trước khi thử lại
          if ((statusCode === 503 || statusCode === 429) && attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }

    // Nếu tất cả các lần gọi Gemini API đều bị quá tải (503), chuyển sang Rule-based Fallback để không bao giờ lỗi UI
    console.log('[GEMINI FALLBACK] Tất cả model Gemini quá tải, sử dụng nhận xét dự phòng thông minh.');
    return res.status(200).json({ status: 'OK', data: getFallbackComment() });
  } catch (err) {
    console.error('Gemini AI Controller Fatal Error:', err.message);
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
  generateAIComment,
};
