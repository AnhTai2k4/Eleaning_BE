const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
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
    jwt.verify(token, process.env.Refresh_token, async (err, user) => {
      if (err) {
        return resolve({
          success: false,
          message: "The authentication error.",
        });
      }

      const { id, name, username, email, isAdmin, isTeacher, phone } = user;
      const Access_token = await createAccessToken({ id, isAdmin, isTeacher, username, email, phone });

      resolve({
        success: true,
        message: "Create token hoàn thành",
        data: {
          access_token: Access_token,
          user: { id, name, email, username, isAdmin, isTeacher },
        },
      });
    });
  });
};

module.exports = { createAccessToken, createRefreshToken, refreshTokenService };
