const UserService = require("../services/UserService");
const JwtService = require("../services/JwtService");
const cookieParser = require("cookie-parser");
const User = require("../models/UserModel");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const googleLogin = async (req, res) => {
  try {
    // 1. Lấy cái vé (token) mà Frontend gửi xuống
    const { token } = req.body;
    console.log("Token nhận được từ Frontend:", token);
    if (!token) {
      return res.status(400).json({ message: "Thiếu token từ Google" });
    }

    // 2. GỌI LÊN SERVER GOOGLE ĐỂ XÁC MINH VÀ LẤY THÔNG TIN
    let googleUserInfo;
    try {
      const googleResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      googleUserInfo = googleResponse.data;
    } catch (error) {
      console.log(
        "Lỗi chi tiết từ Google:",
        error.response?.data || error.message,
      );
      return res
        .status(401)
        .json({ message: "Token Google không hợp lệ hoặc đã hết hạn" });
    }

    // Thông tin Google trả về sẽ có các trường này
    const { email, name, picture } = googleUserInfo;

    // 3. KIỂM TRA TRONG DATABASE CỦA HỆ THỐNG
    let user = await User.findOne({ email: email });

    if (!user) {
      // 1. TẠO DỮ LIỆU CHO USER MỚI

      // Vì đăng nhập Google không có mật khẩu, mình sẽ tạo một pass ngẫu nhiên
      // và Hash nó lại để tránh lỗi Schema nếu em để trường password là required.
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashPassword = await bcrypt.hash(randomPassword, 10);

      // Tạo username tự động (Ví dụ: tranthanhanhtai2909)
      const username = email.split("@")[0];

      // 2. LƯU VÀO DATABASE (Khớp với cấu trúc User.create của em)
      user = await User.create({
        name: name,
        username: username,
        email: email,
        password: hashPassword,
        confirmPassword: hashPassword, // Em truyền giống password để pass qua validation của Schema nếu có
        phone: "", // Google thường không trả về SĐT trực tiếp vì bảo mật, nên để trống để user cập nhật sau
        avatar: picture,
        isAdmin: false,
      });

      console.log("Đã tạo user mới từ Google:", user.email);
    }

    // 4. TẠO TOKEN CỦA RIÊNG HỆ THỐNG (JSON Web Token)
    // Đây chính là cái access_token mà hệ thống VSTEP của em cấp để dùng cho các tính năng khác
    const access_token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
        isTeacher: user.isTeacher,
      },
      process.env.JWT_SECRET || "chuoi_bi_mat_cua_vstep_ne", // Lấy từ file .env
      { expiresIn: "1d" }, // Hạn sử dụng 1 ngày
    );

    // Tùy chọn: Em có thể tạo thêm refresh_token ở đây nếu cần thiết
    // const refresh_token = jwt.sign(..., { expiresIn: '365d' });

    // 5. TRẢ KẾT QUẢ VỀ CHO FRONTEND
    // Cấu trúc này khớp hoàn toàn với những gì Frontend lúc nãy đang "hứng"
    return res.status(200).json({
      message: "Đăng nhập bằng Google thành công!",
      access_token: access_token,
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isTeacher: user.isTeacher,
        phone: user.phone || "",
        avatar: user.avatar || picture,
      },
    });
  } catch (error) {
    console.error("Lỗi tại api/user/google-login:", error);
    return res.status(500).json({ message: "Lỗi hệ thống Backend!" });
  }
};
const createUser = async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword, phone } =
      req.body;

    // validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu đầu vào",
      });
    }

    // gọi service
    const result = await UserService.createUser({
      name,
      username,
      email,
      password,
      confirmPassword,
      phone,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // ✅ trả về model vừa tạo
    return res.status(201).json({
      success: true,
      message: "Tạo user thành công",
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

//Check username
const checkUsername = async (req, res) => {
  try {
    const { username } = req.body;

    // validate input
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu đầu vào",
      });
    }

    // gọi service
    const result = await UserService.checkUsername({ username });

    if (!result.success) {
      return res.status(400).json({
        data: result.data,
      });
    }

    // ✅ trả về thông tin username và credentials
    return res.status(200).json({
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const signinUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu đầu vào",
      });
    }

    // gọi service
    const result = await UserService.signinUser({ username, password });

    // Trường hợp username hoặc mật khẩu sai
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || "Sai tài khoản hoặc mật khẩu",
      });
    }

    // Trường hợp user bật 2FA: chỉ xác thực mật khẩu, không trả token
    if (result.data && result.data.requiresTwoFactor) {
      return res.status(200).json({
        success: true,
        data: result.data, // { requiresTwoFactor, username, message }
      });
    }

    // Trường hợp đăng nhập bình thường, có Access_token + Refresh_token
    const { Refresh_token, ...newResult } = result.data || {};

    if (Refresh_token) {
      try {
        res.cookie("Refresh_token", Refresh_token, {
          httpOnly: true,
          secure: false, // true khi deploy lên https
          sameSite: "lax", // phải viết đúng sameSite
          path: "/",
        });
        console.log("Tao cookie thanh cong ne");
      } catch (err) {
        console.log("Khong tao duoc cookie ne", err);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Dang nhap user thành công",
      data: newResult,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const registOption = async (req, res) => {
  try {
    const { username } = req.body;
    console.log(username);
    if (!username) {
      return res.status(400).json({
        message: "Vui long nhap username",
      });
    }
    const result = await UserService.registOption(username);

    if (result.status) return res.status(200).json({ option: result.data });
    else {
      return res.status(400).json({ message: result.message });
    }
  } catch (err) {
    console.error("Error in RegistOptions:", err);
    return res.status(400).json({ message: err.message });
  }
};

const addRegister = async (req, res) => {
  try {
    const { username } = req.body;
    console.log(username);

    const result = await UserService.addRegister(username);

    if (result.status) return res.status(200).json({ option: result.data });
    else {
      return res.status(400).json({ message: result.message });
    }
  } catch (err) {
    console.error("Error in addRegister:", err);
    return res.status(400).json({ message: err.message });
  }
};

const addVerify = async (req, res) => {
  try {
    const { username, attResp } = req.body;
    console.log("Verify", username);

    const result = await UserService.addVerify({ username, attResp });

    if (result.status) return res.status(200).json({ data: result.data });
    else {
      return res.status(400).json({ message: result.message });
    }
  } catch (err) {
    console.error("Error in addVerify:", err);
    return res.status(400).json({ message: err.message });
  }
};

const registVerify = async (req, res) => {
  const { username, attResp } = req.body;
  if (!attResp)
    return res
      .status(400)
      .json({ message: "Trình duyệt chưa đăng ký key thành công" });
  const result = await UserService.registVerify({ username, attResp });
  if (result.status) {
    return res.status(200).json({
      verified: true,
      message: "Đăng ký thành công",
      credential: result.credential,
    });
  }
  return res.status(400).json({ message: "Xác thực không thành công" });
};

const loginOption = async (req, res) => {
  try {
    const { username } = req.body;

    const options = await UserService.loginOption(username);

    if (options) return res.status(200).json(options);
    else {
      return res
        .status(400)
        .json({ error: "Tao challenge dang nhap that bai" });
    }
  } catch (error) {
    console.error("Error in loginOption:", error);
    return res.status(400).json({ error: error.message });
  }
};

const loginVerify = async (req, res) => {
  try {
    const { username, authResp } = req.body;

    const result = await UserService.loginVerify({ username, authResp });
    console.log(result);
    if (result.status) {
      const { Refresh_token, ...newResult } = result;

      try {
        res.cookie("Refresh_token", Refresh_token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
        });
      } catch (err) {
        console.log("Khong tao duoc cookie ne", err);
      }

      return res.status(200).json({
        verified: true,
        Access_token: newResult.Access_token,
        userId: newResult.userId,
      });
    } else {
      return res.status(400).json({ error: "Xac thuc that bai" });
    }
  } catch (error) {
    console.error("Error in loginVerify:", error);
    return res.status(400).json({ error: error.message });
  }
};

const loginVerifyTwoFactor = async (req, res) => {
  try {
    const { username, authResp } = req.body;

    const result = await UserService.loginVerifyTwoFactor({
      username,
      authResp,
    });
    console.log(result);
    if (result.status) {
      const { Refresh_token, ...newResult } = result;

      try {
        res.cookie("Refresh_token", Refresh_token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
        });
      } catch (err) {
        console.log("Khong tao duoc cookie ne", err);
      }

      return res.status(200).json({
        verified: true,
        Access_token: newResult.Access_token,
        userId: newResult.userId,
      });
    } else {
      return res.status(400).json({ error: "Xac thuc that bai" });
    }
  } catch (error) {
    console.error("Error in loginVerifyTwoFactor:", error);
    return res.status(400).json({ error: error.message });
  }
};

// WebAuthn credential management helpers
const getWebauthnCredentials = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await UserService.getWebauthnCredentials(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách thiết bị WebAuthn thành công",
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const removeWebauthnCredential = async (req, res) => {
  try {
    const userId = req.params.id;
    const credentialId = decodeURIComponent(req.params.credentialId);

    const result = await UserService.removeWebauthnCredential({
      userId,
      credentialId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa thiết bị WebAuthn thành công",
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const renameWebauthnCredential = async (req, res) => {
  try {
    const userId = req.params.id;
    const credentialId = decodeURIComponent(req.params.credentialId);
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Tên thiết bị không được để trống",
      });
    }

    const result = await UserService.renameWebauthnCredential({
      userId,
      credentialId,
      name: name.trim(),
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đổi tên thiết bị WebAuthn thành công",
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    // gọi service
    const result = await UserService.updateUser({ id, data });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // ✅ trả về model vừa tạo
    return res.status(201).json({
      success: true,
      message: "Update user thành công",
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const token = req.headers.token.split(" ")[1];
    console.log("id bi xoa ne", id);
    console.log("token ne", token);

    //gọi service
    const result = await UserService.deleteUser(id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // ✅ trả về model vừa tạo
    return res.status(201).json({
      success: true,
      message: "Delete user thành công",
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const getAllUser = async (req, res) => {
  try {
    // gọi service
    const result = await UserService.getAllUser();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // ✅ trả về model vừa tạo
    return res.status(201).json({
      success: true,
      message: "Nhan all user thành công",
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// const getWebauthnCredentials = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const result = await UserService.getWebauthnCredentials(userId);

//     if (!result.success) {
//       return res.status(400).json({
//         success: false,
//         message: result.message,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Lấy danh sách thiết bị WebAuthn thành công",
//       data: result.data,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: e.message,
//     });
//   }
// };

// const removeWebauthnCredential = async (req, res) => {
//   try {
//     const userId = req.params.id;
//     // Decode credentialId từ URL (FE đã encode)
//     const credentialId = decodeURIComponent(req.params.credentialId);

//     const result = await UserService.removeWebauthnCredential({
//       userId,
//       credentialId,
//     });

//     if (!result.success) {
//       return res.status(400).json({
//         success: false,
//         message: result.message,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Xóa thiết bị WebAuthn thành công",
//       data: result.data,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: e.message,
//     });
//   }
// };

// const renameWebauthnCredential = async (req, res) => {
//   try {
//     const userId = req.params.id;
//     // Decode credentialId từ URL (FE đã encode)
//     const credentialId = decodeURIComponent(req.params.credentialId);
//     const { name } = req.body;

//     if (!name || name.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Tên thiết bị không được để trống",
//       });
//     }

//     const result = await UserService.renameWebauthnCredential({
//       userId,
//       credentialId,
//       name: name.trim(),
//     });

//     if (!result.success) {
//       return res.status(400).json({
//         success: false,
//         message: result.message,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Đổi tên thiết bị WebAuthn thành công",
//       data: result.data,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: e.message,
//     });
//   }
// };

const getUser = async (req, res) => {
  try {
    // gọi service
    const result = await UserService.getUser(req.params.id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // ✅ trả về model vừa tạo
    return res.status(201).json({
      success: true,
      message: "Nhan user thành công",
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    console.log("req.cookie", req.cookies);
    const token = req.cookies.Refresh_token;
    console.log("token ne", token);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token la bat buoc",
      });
    }

    const result = await JwtService.refreshTokenService(token);
    console.log("result ne", result);

    // ✅ trả về model vừa tạo
    return res.status(201).json({
      success: true,
      message: "Nhan user thành công",
      data: result.data,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("Refresh_token", {
      httpOnly: true,
      secure: false, // true khi deploy lên https
      sameSite: "lax", // phải viết đúng sameSite
    });
    return res.status(200).json({
      success: true,
      data: "Logout successful",
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      data: e.message,
    });
  }
};

module.exports = {
  createUser,
  checkUsername,
  signinUser,
  registOption,
  addRegister,
  addVerify,
  registVerify,
  loginOption,
  loginVerify,
  loginVerifyTwoFactor,
  getWebauthnCredentials,
  removeWebauthnCredential,
  renameWebauthnCredential,
  updateUser,
  deleteUser,
  getAllUser,
  getUser,
  refreshToken,
  logoutUser,
  googleLogin,
};
