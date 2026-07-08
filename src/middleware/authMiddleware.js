const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const authMiddleware = (req, res, next) => {
  try {
    const headerToken = req.headers.token || req.headers.authorization;
    console.log("headerToken:", headerToken);
    
    if (!headerToken) {
      return res.status(403).json({
        success: false,
        message: "Token không được cung cấp",
      });
    }

    let token;
    if (headerToken.startsWith("Bearer ")) {
      token = headerToken.split(" ")[1];
    } else {
      token = headerToken;
    }

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    jwt.verify(token, process.env.Access_token, function (err, user) {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token không hợp lệ",
        });
      } else {
        console.log(user);
        req.user = user;
        const { isAdmin } = user;
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: "Bạn không có quyền truy cập",
          });
        } else {
          next();
        }
      }
    });
  } catch (error) {
    console.error("Error in authMiddleware:", error);
    return res.status(403).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

const authUserMiddleware = (req, res, next) => {
  try {
    const headerToken = req.headers.token || req.headers.authorization;
    console.log("headerToken:", headerToken);
    
    if (!headerToken) {
      return res.status(403).json({
        success: false,
        message: "Token không được cung cấp",
      });
    }

    // Xử lý cả trường hợp "Bearer token" và chỉ "token"
    let token;
    if (headerToken.startsWith("Bearer ")) {
      token = headerToken.split(" ")[1];
    } else {
      token = headerToken;
    }

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    console.log('token ne', token);

    jwt.verify(token, process.env.Access_token, function (err, user) {
      if (err) {
        console.log('Loi o day', err);
        return res.status(403).json({
          success: false,
          message: "Token không hợp lệ",
        });
      } else {
        console.log(user);
        req.user = user;
        const { isAdmin } = user;
        if (isAdmin || user.id == req.params.id || user._id == req.params.id) {
         next();
        } else {
           return res.status(403).json({
            success: false,
            message: "Bạn không có quyền xem user",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error in authUserMiddleware:", error);
    return res.status(403).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

const authGeneralMiddleware = (req, res, next) => {
  try {
    const headerToken = req.headers.token || req.headers.authorization;
    if (!headerToken) {
      return res.status(403).json({
        success: false,
        message: "Token không được cung cấp",
      });
    }

    let token;
    if (headerToken.startsWith("Bearer ")) {
      token = headerToken.split(" ")[1];
    } else {
      token = headerToken;
    }

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    jwt.verify(token, process.env.Access_token, function (err, user) {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token không hợp lệ",
        });
      } else {
        req.user = user;
        next();
      }
    });
  } catch (error) {
    console.error("Error in authGeneralMiddleware:", error);
    return res.status(403).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

module.exports = { authMiddleware, authUserMiddleware, authGeneralMiddleware };
