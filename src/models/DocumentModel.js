const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocumentSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  grade: { type: Number, enum: [10, 11, 12], default: 12 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Document = mongoose.model('Document', DocumentSchema);

module.exports = { Document };
