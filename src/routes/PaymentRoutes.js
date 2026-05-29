const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const PaymentController = require("../controllers/PaymentController");

// Middleware xác thực token đơn giản cho khách hàng thanh toán
const authCustomer = (req, res, next) => {
  try {
    const authHeader = req.headers.token || req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Token không được cung cấp" });
    }
    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    jwt.verify(token, process.env.Access_token, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc hết hạn" });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Xác thực người dùng thất bại" });
  }
};

// Route tạo URL thanh toán (Yêu cầu đăng nhập)
router.post("/create-momo-url", authCustomer, PaymentController.createMomoPayment);
router.post("/mock-success", authCustomer, PaymentController.mockPaymentSuccess);

// Route verify kết quả thanh toán từ Client gửi lên (Không cần token vì đã có bảo mật chữ ký chữ ký từ cổng thanh toán)
router.post("/momo-verify", PaymentController.verifyMomoPayment);

module.exports = router;
