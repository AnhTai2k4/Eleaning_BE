const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/UserModel");
dotenv.config();

const createAccessToken = async (payload) => {
  const Access_token = jwt.sign(payload, process.env.Access_token, {
    expiresIn: "1d",
  });
  return Access_token;
};

const createRefreshToken = async (payload) => {
  const Refresh_token = jwt.sign(payload, process.env.Refresh_token, {
    expiresIn: "365d",
  });
  return Refresh_token;
};

const refreshTokenService = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.Refresh_token, async (err, decodedUser) => {
      if (err) {
        return resolve({
          success: false,
          message: "The authentication error.",
        });
      }

      try {
        const dbUser = await User.findById(decodedUser.id);
        if (!dbUser) {
          return resolve({
            success: false,
            message: "Không tìm thấy người dùng.",
          });
        }

        const Access_token = await createAccessToken({
          id: dbUser._id,
          isAdmin: dbUser.isAdmin,
          isTeacher: dbUser.isTeacher,
          username: dbUser.username,
          email: dbUser.email,
          phone: dbUser.phone,
        });

        resolve({
          success: true,
          message: "Create token hoàn thành",
          data: {
            access_token: Access_token,
            user: {
              id: dbUser._id,
              name: dbUser.name,
              email: dbUser.email,
              username: dbUser.username,
              isAdmin: dbUser.isAdmin,
              isTeacher: dbUser.isTeacher,
              phone: dbUser.phone || "",
              courseBuyed: dbUser.courseBuyed || [],
              completedLessons: dbUser.completedLessons || []
            },
          },
        });
      } catch (dbErr) {
        resolve({
          success: false,
          message: dbErr.message,
        });
      }
    });
  });
};

module.exports = { createAccessToken, createRefreshToken, refreshTokenService };
