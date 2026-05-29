const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ====================================================================
//  LEARNING PLANNER — Liên kết chặt: Goal ↔ DailyAction ↔ WeeklySummary
//
//  Quan hệ logic:
//    Goal (tháng)  1 ── * DailyAction (ngày)    : goalId trên Action
//    Goal (tháng)  1 ── * WeeklySummary (tuần)   : goalId trên Summary
//    WeeklySummary 1 ── * DailyAction (ngày)     : summaryId trên Action
//
//  Goal cũng giữ mảng tham chiếu ngược (actionIds, summaryIds) để
//  populate nhanh mà không cần aggregate.
// ====================================================================

// ===================== 1. MỤC TIÊU THÁNG =====================
const GoalSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },           // 1-12
  year: { type: Number, required: true },
  goals: [{
    aspect: { type: String, default: '' },
    duration: { type: String, default: '' },
    action: { type: String, default: '' },
    expectedScore: { type: Number, default: 10 }
  }],
  status: { type: String, enum: ['draft', 'submitted', 'reviewed'], default: 'draft' },
  mentorComment: { type: String, default: '' },       // Lời dặn/nhận xét của Mentor
  mentorCommentAt: { type: Date },

  // ── Tham chiếu ngược (denormalized) để truy vấn nhanh ──
  actionIds:  [{ type: Schema.Types.ObjectId, ref: 'DailyAction' }],
  summaryIds: [{ type: Schema.Types.ObjectId, ref: 'WeeklySummary' }],
}, { timestamps: true });

// Compound index: tìm goal theo student + tháng/năm nhanh
GoalSchema.index({ studentId: 1, year: 1, month: 1 }, { unique: true });

// ===================== 2. HÀNH ĐỘNG HÀNG NGÀY =====================
const DailyActionSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Liên kết chặt với Goal (tháng) và Summary (tuần) ──
  goalId:    { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
  summaryId: { type: Schema.Types.ObjectId, ref: 'WeeklySummary', default: null },
  //   summaryId có thể null lúc tạo, gán khi tổng kết tuần được tạo/cập nhật

  date: { type: Date, required: true },
  tasks: [{
    aspect: { type: String, default: '' },
    time: { type: String, default: '' },
    actualTime: { type: Number, default: 0 },
    action: { type: String, default: '' },
    score: { type: Number, default: 10 }
  }],
  reflection: { type: String, default: '' },             // Bài học đúc kết trong ngày
  selfScore: { type: Number, min: 1, max: 10 },         // Tự chấm điểm kỷ luật
  aiScore: { type: Number },                             // AI chấm điểm
  aiFeedback: { type: String },                          // Phản hồi của AI
  teacherComment: { type: String, default: '' },        // Giáo viên nhận xét
  teacherScore: { type: Number },
  teacherCommentAt: { type: Date },
  status: { type: String, enum: ['draft', 'submitted', 'reviewed'], default: 'draft' }
}, { timestamps: true });

// Compound indexes cho các truy vấn thường gặp
DailyActionSchema.index({ studentId: 1, date: -1 });
DailyActionSchema.index({ goalId: 1, date: -1 });
DailyActionSchema.index({ summaryId: 1 });

// ===================== 3. TỔNG KẾT TUẦN =====================
const WeeklySummarySchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Liên kết chặt với Goal (tháng) ──
  goalId: { type: Schema.Types.ObjectId, ref: 'Goal', required: true },

  // ── Tham chiếu ngược tới các action trong tuần ──
  actionIds: [{ type: Schema.Types.ObjectId, ref: 'DailyAction' }],

  weekNumber: { type: Number, required: true },          // Tuần thứ mấy trong năm
  year: { type: Number, required: true },
  startDate: { type: Date },                              // Ngày đầu tuần (dễ filter)
  endDate:   { type: Date },                              // Ngày cuối tuần

  totalExpectedHours: { type: Number, default: 0 },      // Tổng giờ dự kiến
  totalActualHours: { type: Number, default: 0 },        // Tổng giờ thực tế
  achievementRate: { type: Number, default: 0 },         // % hoàn thành mục tiêu
  studentReflection: { type: String, default: '' },      // Nhìn lại + rút kinh nghiệm
  teacherComment: { type: String, default: '' },         // Nhận xét của GV
  teacherScore: { type: Number, min: 1, max: 10 },      // Điểm tổng tuần
  teacherCommentAt: { type: Date },
  status: { type: String, enum: ['draft', 'submitted', 'reviewed'], default: 'draft' }
}, { timestamps: true });

// Compound indexes
WeeklySummarySchema.index({ studentId: 1, year: 1, weekNumber: 1 }, { unique: true });
WeeklySummarySchema.index({ goalId: 1 });

// ====================================================================
//  MIDDLEWARE: Tự đồng bộ tham chiếu ngược khi tạo mới
// ====================================================================

// Khi tạo DailyAction → push _id vào Goal.actionIds
DailyActionSchema.post('save', async function (doc) {
  if (doc.wasNew) {
    await mongoose.model('Goal').findByIdAndUpdate(doc.goalId, {
      $addToSet: { actionIds: doc._id }
    });
    // Nếu đã gán summaryId thì cũng push vào Summary.actionIds
    if (doc.summaryId) {
      await mongoose.model('WeeklySummary').findByIdAndUpdate(doc.summaryId, {
        $addToSet: { actionIds: doc._id }
      });
    }
  }
});

// Đánh dấu document mới trước khi save
DailyActionSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

// Khi tạo WeeklySummary → push _id vào Goal.summaryIds
WeeklySummarySchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

WeeklySummarySchema.post('save', async function (doc) {
  if (doc.wasNew) {
    await mongoose.model('Goal').findByIdAndUpdate(doc.goalId, {
      $addToSet: { summaryIds: doc._id }
    });
  }
});

// ====================================================================

const Goal = mongoose.model('Goal', GoalSchema);
const DailyAction = mongoose.model('DailyAction', DailyActionSchema);
const WeeklySummary = mongoose.model('WeeklySummary', WeeklySummarySchema);

module.exports = { Goal, DailyAction, WeeklySummary };