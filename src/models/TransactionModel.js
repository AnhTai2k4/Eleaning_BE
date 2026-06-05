const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    amount: { type: Number, required: true },
    method: { type: String, default: "MoMo" },
    status: {
      type: String,
      enum: ["Thành công", "Chờ xử lý", "Thất bại"],
      default: "Thành công"
    },
    orderId: { type: String, required: false }
  },
  {
    timestamps: true
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
