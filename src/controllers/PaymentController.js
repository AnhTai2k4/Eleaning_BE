const crypto = require("crypto");
const axios = require("axios");
const Course = require("../models/CourseModel");
const User = require("../models/UserModel");
const Transaction = require("../models/TransactionModel");



const createMomoPayment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "Thiếu courseId" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Không tìm thấy khóa học" });
    }

    const amount = course.price;
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const momoApiUrl = process.env.MOMO_API_URL;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;

    const orderId = `${Date.now()}`;
    const requestId = orderId;
    const orderInfo = `Thanh toan khoa hoc ${course.title}`;
    const requestType = "payWithMethod";
    const extraData = Buffer.from(
      JSON.stringify({ courseId: course._id.toString(), userId })
    ).toString("base64");

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode,
      partnerName: "ToanMath",
      storeId: partnerCode,
      requestId,
      amount: amount.toString(),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: "vi",
      requestType,
      autoCapture: true,
      extraData,
      signature,
    };

    const response = await axios.post(momoApiUrl, requestBody);
    if (response.data && response.data.payUrl) {
      return res.status(200).json({ success: true, paymentUrl: response.data.payUrl });
    } else {
      return res.status(400).json({
        success: false,
        message: response.data.message || "Không lấy được link thanh toán MoMo",
      });
    }
  } catch (error) {
    console.error("Lỗi tạo link MoMo:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Lỗi server MoMo" });
  }
};

const verifyMomoPayment = async (req, res) => {
  try {
    const momo_Params = req.body;
    const { signature } = momo_Params;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;

    const amount = momo_Params.amount;
    const extraData = momo_Params.extraData;
    const message = momo_Params.message;
    const orderId = momo_Params.orderId;
    const orderInfo = momo_Params.orderInfo;
    const orderType = momo_Params.orderType;
    const partnerCode = momo_Params.partnerCode;
    const payType = momo_Params.payType;
    const requestId = momo_Params.requestId;
    const responseTime = momo_Params.responseTime;
    const resultCode = momo_Params.resultCode;
    const transId = momo_Params.transId;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const computedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    if (signature === computedSignature) {
      if (parseInt(resultCode) === 0) {
        const decodedExtraData = JSON.parse(
          Buffer.from(extraData, "base64").toString("ascii")
        );
        const { userId, courseId } = decodedExtraData;

        const user = await User.findById(userId);
        const course = await Course.findById(courseId);
        if (user) {
          if (!user.courseBuyed.includes(courseId)) {
            user.courseBuyed.push(courseId);
            await user.save();
          }

          // Create real Transaction entry
          await Transaction.create({
            user: userId,
            course: courseId,
            amount: course ? course.price : 500000,
            method: "MoMo",
            status: "Thành công",
            orderId: orderId || `${Date.now()}`
          });

          return res.status(200).json({
            success: true,
            message: "Thanh toán MoMo thành công",
            courseId,
            courseSlug: course ? course.slug : "",
            courseTitle: course ? course.title : "",
          });
        }
      }
    }
    return res
      .status(400)
      .json({ success: false, message: "Xác minh chữ ký MoMo thất bại hoặc lỗi thanh toán" });
  } catch (error) {
    console.error("Lỗi xác minh MoMo:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const mockPaymentSuccess = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "Thiếu courseId" });
    }

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (!user.courseBuyed.includes(courseId)) {
      user.courseBuyed.push(courseId);
      await user.save();
    }

    // Create real Transaction entry
    await Transaction.create({
      user: userId,
      course: courseId,
      amount: course ? course.price : 500000,
      method: "MoMo",
      status: "Thành công",
      orderId: `MOCK-${Date.now()}`
    });

    return res.status(200).json({
      success: true,
      message: "Thanh toán thành công (Bypass)",
      courseId,
      courseSlug: course ? course.slug : "",
      courseTitle: course ? course.title : "",
    });
  } catch (error) {
    console.error("Lỗi mock thanh toán:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    // 1. Fetch all current transactions
    let transactions = await Transaction.find();
    const existingTxKeys = new Set(
      transactions.map(tx => `${tx.user.toString()}_${tx.course.toString()}`)
    );

    // 2. Fetch all users and courses
    const users = await User.find({ courseBuyed: { $exists: true, $not: { $size: 0 } } });
    const courses = await Course.find();
    const courseMap = {};
    courses.forEach(c => {
      courseMap[c._id.toString()] = c;
    });

    // 3. Find missing transactions and backfill them
    const backfillData = [];
    for (const u of users) {
      if (u.courseBuyed) {
        for (const courseId of u.courseBuyed) {
          const key = `${u._id.toString()}_${courseId.toString()}`;
          if (!existingTxKeys.has(key)) {
            const c = courseMap[courseId.toString()];
            if (c) {
              backfillData.push({
                user: u._id,
                course: c._id,
                amount: c.price || 500000,
                method: "MoMo",
                status: "Thành công",
                orderId: `BF-${u._id.toString().substring(18).toUpperCase()}-${c._id.toString().substring(18).toUpperCase()}`,
                createdAt: u.createdAt || new Date()
              });
            }
          }
        }
      }
    }

    if (backfillData.length > 0) {
      console.log(`Auto-synchronizing ${backfillData.length} missing transactions...`);
      await Transaction.insertMany(backfillData);
    }

    // 4. Fetch the final populated and sorted transactions list
    const finalTransactions = await Transaction.find()
      .populate("user", "name email")
      .populate("course", "title price grade")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: finalTransactions
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách giao dịch:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  createMomoPayment,
  verifyMomoPayment,
  mockPaymentSuccess,
  getAllTransactions,
};
