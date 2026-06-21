const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    user: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      email: { type: String },
      isAdmin: { type: Boolean, default: false },
      isTeacher: { type: Boolean, default: false }
    },
    content: { type: String, required: true },
    images: [{ type: String }],
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
