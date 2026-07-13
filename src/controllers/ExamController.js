const { Exam, Submission } = require('../models/ExamModel');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

// Helper check quyền Quản trị viên / Giáo viên
const isStaffUser = async (req) => {
  try {
    const tokenHeader = req.headers.token || req.headers.authorization;
    if (tokenHeader) {
      const token = tokenHeader.startsWith('Bearer ') ? tokenHeader.split(' ')[1] : tokenHeader;
      const decoded = jwt.verify(token, process.env.Access_token || process.env.ACCESS_TOKEN_SECRET || 'access_token');
      if (decoded && (decoded.isAdmin || decoded.isTeacher)) return true;
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id);
        if (user && (user.isAdmin || user.isTeacher)) return true;
      }
    }
  } catch (err) {
    return false;
  }
  return false;
};

// 1. Giáo viên tạo đề thi
const createExam = async (req, res) => {
  try {
    const { title, description, fileUrl, duration, questionsCount, answers, type, grade, createdBy } = req.body;
    
    if (!title || !createdBy) {
      return res.status(400).json({ status: 'ERR', message: 'Thiếu thông tin bắt buộc' });
    }

    const exam = await Exam.create({
      title,
      description,
      fileUrl,
      duration: Number(duration),
      questionsCount: Number(questionsCount),
      answers, 
      type,
      grade: grade ? Number(grade) : 12,
      createdBy
    });

    res.status(201).json({ status: 'OK', data: exam });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 2. Giáo viên chỉnh sửa đáp án/đề thi
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Exam.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ status: 'OK', data: updated });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 3. Xóa đề thi
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    await Exam.findByIdAndDelete(id);
    res.status(200).json({ status: 'OK', message: 'Xóa đề thi thành công' });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 4. Lấy tất cả đề thi/bài tập (Ẩn đáp án đối với học sinh, chỉ hiển thị cho Giáo viên/Admin để quản lý)
const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    const staff = await isStaffUser(req);
    const result = exams.map(ex => {
      const obj = ex.toObject();
      if (!staff) {
        delete obj.answers;
      }
      return obj;
    });
    res.status(200).json({ status: 'OK', data: result });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 5. Chi tiết đề thi (Ẩn đáp án đối với học sinh, chỉ hiển thị cho Giáo viên/Admin)
const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy đề thi' });
    }
    const obj = exam.toObject();
    const staff = await isStaffUser(req);
    if (!staff) {
      delete obj.answers;
    }
    res.status(200).json({ status: 'OK', data: obj });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 6. Học sinh bắt đầu / khôi phục lượt làm bài (F5 safe)
const startAttempt = async (req, res) => {
  try {
    const { examId, studentId } = req.body;
    if (!examId || !studentId) {
      return res.status(400).json({ status: 'ERR', message: 'Thiếu thông tin bắt buộc' });
    }

    let submission = await Submission.findOne({ examId, studentId, status: 'in_progress' });
    
    if (submission) {
      const exam = await Exam.findById(examId);
      if (exam) {
        const elapsed = (Date.now() - new Date(submission.startedAt).getTime()) / 1000;
        if (elapsed >= exam.duration * 60) {
          await Submission.deleteOne({ _id: submission._id });
          submission = null;
        }
      }
    }

    if (!submission) {
      await Submission.deleteMany({ examId, studentId, status: 'completed' });
      submission = await Submission.create({
        examId,
        studentId,
        answers: {},
        score: -1,
        status: 'in_progress',
        startedAt: new Date()
      });
    }

    res.status(200).json({ status: 'OK', data: submission });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 7. Lưu tiến trình làm bài tự động (Auto-save)
const saveAttemptProgress = async (req, res) => {
  try {
    const { examId, studentId, studentAnswers } = req.body;
    const submission = await Submission.findOneAndUpdate(
      { examId, studentId, status: 'in_progress' },
      { $set: { answers: studentAnswers } },
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy lượt làm bài đang diễn ra' });
    }
    res.status(200).json({ status: 'OK', data: submission });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 8. Học sinh hoàn thành và nộp bài thi
const submitAttempt = async (req, res) => {
  try {
    const { examId, studentId, studentAnswers } = req.body;
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ status: 'ERR', message: 'Không tìm thấy đề thi' });
    }

    let score = 0;
    const isThptMathFormat = exam.answers.has('13_a') || exam.answers.has('17');

    if (isThptMathFormat) {
      for (let q = 1; q <= 12; q++) {
        const key = String(q);
        if (studentAnswers[key] && studentAnswers[key] === exam.answers.get(key)) {
          score += 0.25;
        }
      }
      for (let q = 13; q <= 16; q++) {
        let correctSubCount = 0;
        ['a', 'b', 'c', 'd'].forEach((sub) => {
          const key = `${q}_${sub}`;
          if (studentAnswers[key] && studentAnswers[key] === exam.answers.get(key)) {
            correctSubCount += 1;
          }
        });
        if (correctSubCount === 1) score += 0.1;
        else if (correctSubCount === 2) score += 0.25;
        else if (correctSubCount === 3) score += 0.5;
        else if (correctSubCount === 4) score += 1.0;
      }
      for (let q = 17; q <= 22; q++) {
        const key = String(q);
        const studentAns = studentAnswers[key] ? studentAnswers[key].toString().trim().toLowerCase() : '';
        const correctAns = exam.answers.get(key) ? exam.answers.get(key).toString().trim().toLowerCase() : '';
        if (studentAns && studentAns === correctAns) {
          score += 0.5;
        }
      }
    } else {
      let totalKeys = 0;
      let correctKeys = 0;
      exam.answers.forEach((correctVal, key) => {
        totalKeys += 1;
        const studentVal = studentAnswers[key] ? studentAnswers[key].toString().trim().toLowerCase() : '';
        const normCorrectVal = correctVal ? correctVal.toString().trim().toLowerCase() : '';
        if (studentVal === normCorrectVal) {
          correctKeys += 1;
        }
      });
      score = totalKeys > 0 ? (correctKeys / totalKeys) * 10 : 0;
    }

    const submission = await Submission.findOneAndUpdate(
      { examId, studentId, status: 'in_progress' },
      {
        $set: {
          answers: studentAnswers,
          score: Math.round(score * 100) / 100,
          status: 'completed',
          completedAt: new Date()
        }
      },
      { new: true }
    );

    const fullAnswers = {};
    if (exam.answers && typeof exam.answers.forEach === 'function') {
      exam.answers.forEach((val, key) => { fullAnswers[key] = val; });
    } else if (exam.answers && typeof exam.answers === 'object') {
      Object.assign(fullAnswers, exam.answers);
    }

    if (!submission) {
      const fallbackSub = await Submission.create({
        examId,
        studentId,
        answers: studentAnswers,
        score: Math.round(score * 100) / 100,
        status: 'completed',
        startedAt: new Date(Date.now() - exam.duration * 60 * 1000),
        completedAt: new Date()
      });
      return res.status(200).json({ status: 'OK', data: fallbackSub, correctAnswers: fullAnswers });
    }

    res.status(200).json({ status: 'OK', data: submission, correctAnswers: fullAnswers });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 9. Giáo viên xem danh sách kết quả bài nộp của học sinh
const getSubmissionsByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);

    // Tự động chốt bài và chấm điểm nếu học sinh bỏ dở (out ra) quá thời gian làm bài + 5 phút đệm
    if (exam) {
      const inProgressSubs = await Submission.find({ examId, status: 'in_progress' });
      const durationMs = (exam.duration || 45) * 60 * 1000;
      const now = Date.now();

      for (let sub of inProgressSubs) {
        if (now - new Date(sub.startedAt).getTime() >= durationMs + 5 * 60 * 1000) {
          let score = 0;
          const studentAnswers = sub.answers || new Map();
          const isThptMathFormat = exam.answers && (exam.answers.has('13_a') || exam.answers.has('17'));

          if (isThptMathFormat) {
            for (let q = 1; q <= 12; q++) {
              const key = String(q);
              const sAns = studentAnswers.get ? studentAnswers.get(key) : studentAnswers[key];
              if (sAns && sAns === exam.answers.get(key)) score += 0.25;
            }
            for (let q = 13; q <= 16; q++) {
              let correctSubCount = 0;
              ['a', 'b', 'c', 'd'].forEach((subKey) => {
                const key = `${q}_${subKey}`;
                const sAns = studentAnswers.get ? studentAnswers.get(key) : studentAnswers[key];
                if (sAns && sAns === exam.answers.get(key)) correctSubCount += 1;
              });
              if (correctSubCount === 1) score += 0.1;
              else if (correctSubCount === 2) score += 0.25;
              else if (correctSubCount === 3) score += 0.5;
              else if (correctSubCount === 4) score += 1.0;
            }
            for (let q = 17; q <= 22; q++) {
              const key = String(q);
              const sAns = studentAnswers.get ? studentAnswers.get(key) : studentAnswers[key];
              const studentAns = sAns ? sAns.toString().trim().toLowerCase() : '';
              const correctAns = exam.answers.get(key) ? exam.answers.get(key).toString().trim().toLowerCase() : '';
              if (studentAns && studentAns === correctAns) score += 0.5;
            }
          } else if (exam.answers) {
            let totalKeys = 0;
            let correctKeys = 0;
            exam.answers.forEach((correctVal, key) => {
              totalKeys += 1;
              const sAns = studentAnswers.get ? studentAnswers.get(key) : studentAnswers[key];
              const studentVal = sAns ? sAns.toString().trim().toLowerCase() : '';
              const normCorrectVal = correctVal ? correctVal.toString().trim().toLowerCase() : '';
              if (studentVal === normCorrectVal) correctKeys += 1;
            });
            score = totalKeys > 0 ? (correctKeys / totalKeys) * 10 : 0;
          }

          sub.score = Math.round(score * 100) / 100;
          sub.status = 'completed';
          sub.completedAt = new Date(new Date(sub.startedAt).getTime() + durationMs);
          await sub.save();
        }
      }
    }

    const submissions = await Submission.find({ examId })
      .populate('studentId', 'name username email')
      .sort({ score: -1 });

    const formatted = submissions.map(sub => sub.toObject({ flattenMaps: true }));
    res.status(200).json({ status: 'OK', data: formatted });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 10. Học sinh xem lịch sử làm bài
const getSubmissionsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const submissions = await Submission.find({ studentId })
      .populate('examId', 'title duration questionsCount type grade answers')
      .sort({ completedAt: -1 });

    const formatted = submissions.map(sub => {
      const obj = sub.toObject({ flattenMaps: true });
      if (obj.examId && obj.examId.answers) {
        const flatAns = {};
        if (obj.examId.answers instanceof Map || typeof obj.examId.answers.forEach === 'function') {
          obj.examId.answers.forEach((val, key) => { flatAns[key] = val; });
          obj.examId.answers = flatAns;
        } else if (typeof obj.examId.answers === 'object') {
          Object.assign(flatAns, obj.examId.answers);
          obj.examId.answers = flatAns;
        }
      }
      return obj;
    });

    res.status(200).json({ status: 'OK', data: formatted });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

// 11. Xóa bài làm (cho phép thi lại)
const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    await Submission.findByIdAndDelete(id);
    res.status(200).json({ status: 'OK', message: 'Xóa bài làm thành công' });
  } catch (err) {
    res.status(500).json({ status: 'ERR', message: err.message });
  }
};

module.exports = {
  createExam,
  updateExam,
  deleteExam,
  getAllExams,
  getExamById,
  startAttempt,
  saveAttemptProgress,
  submitAttempt,
  getSubmissionsByExam,
  getSubmissionsByStudent,
  deleteSubmission
};
