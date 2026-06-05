const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LessonSchema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  slug: { type: String, required: true },
  videoType: { type: String, enum: ['youtube', 'vimeo', 'bunny'], default: 'youtube' },
  videoId: { type: String, default: '' },
  duration: { type: String, default: '' },
  isFree: { type: Boolean, default: false }
});

const SectionSchema = new Schema({
  sectionTitle: { type: String, required: true },
  lessons: [LessonSchema]
});

const CourseSchema = new Schema({
  title: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  grade: { type: Number, enum: [10, 11, 12], default: 12 },
  overview: { type: String, default: '' },
  description: { type: String, default: '' },
  sections: [SectionSchema]
}, { timestamps: true });

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;
