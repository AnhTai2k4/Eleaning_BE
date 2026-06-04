const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    email: { type: String, required: false },
    isAdmin: { type: Boolean, default: false, required: false },
    isTeacher: { type: Boolean, default: false, required: false },
    phone: { type: String, required: false },
    accessToken: { type: String, required: false },
    refreshToken: { type: String, required: false },
    challenge: { type: String, default: null },
    isTwoFactorAuth:{type: Boolean, default: false},
    credential: {
      type: {
        id: String,
        publicKey: Buffer,
        createAt: Date,
      },
      default: null,
    },
    // Danh sách thiết bị WebAuthn
    credentials: [
      {
        _id: false,
        credentialId: { type: String },
        name: { type: String, default: "Thiết bị WebAuthn" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Chống brute-force / lock tài khoản
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    // Danh sách khóa học đã mua
    courseBuyed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
