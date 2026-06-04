const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 1. MODEL ĐỀ THI / BÀI TẬP (Giống Azota)
const ExamSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  fileUrl: { type: String, default: '' },       // Đường dẫn file PDF hoặc .docx tải lên
  duration: { type: Number, default: 45 },      // Thời gian làm bài (phút)
  questionsCount: { type: Number, default: 10 },
  answers: { type: Map, of: String },           // Các đáp án đúng: { "1": "A", "13_a": "Đúng", "17": "12" }
  type: { type: String, enum: ['exam', 'homework'], default: 'exam' },
  grade: { type: Number, enum: [10, 11, 12], default: 12 }, // Lớp 10, 11, 12
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// 2. MODEL BÀI NỘP CỦA HỌC SINH
const SubmissionSchema = new Schema({
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  answers: { type: Map, of: String },           // Các phương án học sinh chọn: { "1": "A", "2": "C" }
  score: { type: Number, default: -1 },         // Điểm số (-1 nghĩa là đang làm bài)
  status: { type: String, enum: ['in_progress', 'completed'], default: 'completed' },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

const Exam = mongoose.model('Exam', ExamSchema);
const Submission = mongoose.model('Submission', SubmissionSchema);

module.exports = { Exam, Submission };
