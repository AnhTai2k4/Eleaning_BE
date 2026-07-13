const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const { createAccessToken, createRefreshToken } = require("./JwtService");
const nodemailer = require("nodemailer");
const axios = require("axios");

// const ensureCredentialArray = async (user) => {
//   if (!user) return null;

//   if (
//     (!user.credentials || user.credentials.length === 0) &&
//     user.credential &&
//     user.credential.id
//   ) {
//     user.credentials = [
//       {
//         credentialId: user.credential.id,
//         name: "Thiết bị mặc định",
//         createdAt: user.credential.createAt || new Date(),
//       },
//     ];
//     user.credential = null;
//     await user.save();
//   }

//   if (!user.credentials) {
//     user.credentials = [];
//   }

//   return user;
// };

const createUser = async ({
  name,
  username,
  email,
  password,
  confirmPassword,
  phone,
}) => {
  try {
    // Kiểm tra username tồn tại
    const isCheck = await User.findOne({ username });
    if (isCheck) {
      return {
        success: false,
        message: "Username đã tồn tại",
      };
    }

    const hashPassword = bcrypt.hashSync(password, 10);

    // Tạo user mới
    const newUser = await User.create({
      name,
      username,
      email,
      password: hashPassword,
      confirmPassword,
      phone,
    });

    return {
      success: true,
      data: newUser,
    };
  } catch (e) {
    throw e;
  }
};

// const checkUsername = async ({ username }) => {
//   try {
//     // Kiểm tra username tồn tại
//     const isCheck = await User.findOne({ username });
//     if (!isCheck) {
//       return {
//         success: false,
//         data: "Username khong hop le",
//       };
//     }

//     // Kiểm tra xem user có WebAuthn credentials không
//     const hasCredentials = isCheck.credentials && isCheck.credentials.length > 0;

//     return {
//       success: true,
//       data: {
//         message: "Username hop le",
//         hasWebAuthnCredentials: hasCredentials,
//         isTwoFactorAuth: isCheck.isTwoFactorAuth || false,
//       },
//     };

//   } catch (e) {
//     throw e;
//   }
// };


const signinUser = async ({ username, password }) => {
  try {
    // Kiểm tra username tồn tại
    const isCheck = await User.findOne({ username });
    if (!isCheck) {
      return {
        success: false,
        message: "Emai khong hop le",
      };
    }

    // Nếu tài khoản đang bị khóa (lockUntil trong tương lai) thì không cho thử tiếp
    if (isCheck.lockUntil && isCheck.lockUntil > new Date()) {
      const remainingMs = isCheck.lockUntil.getTime() - Date.now();
      const remainingSec = Math.ceil(remainingMs / 1000);
      const remainingMin = Math.ceil(remainingSec / 60);
      return {
        success: false,
        message:
          remainingSec > 60
            ? `Tài khoản đang bị khóa, vui lòng thử lại sau ${remainingMin} phút (${remainingSec} giây)`
            : `Tài khoản đang bị khóa, vui lòng thử lại sau ${remainingSec} giây`,
      };
    }

    let comparePassword = await bcrypt.compare(password, isCheck.password);
    // Hỗ trợ tự động khắc phục: nếu mật khẩu trong DB đang bị lưu bản gốc (plaintext),
    // kiểm tra khớp trực tiếp và tự động mã hóa lại ngay trong DB!
    if (!comparePassword && isCheck.password === password) {
      comparePassword = true;
      isCheck.password = bcrypt.hashSync(password, 10);
      await isCheck.save();
    }
    console.log(comparePassword);
    if (comparePassword) {
      // Reset đếm sai & mở khóa nếu đăng nhập đúng
      if (isCheck.failedLoginAttempts || isCheck.lockUntil) {
        isCheck.failedLoginAttempts = 0;
        isCheck.lockUntil = null;
        await isCheck.save();
      }

      // Nếu bật 2FA, chỉ xác thực mật khẩu, không trả token (cần xác thực WebAuthn ở bước 2)
      if (isCheck.isTwoFactorAuth) {
        return {
          success: true,
          data: { 
            requiresTwoFactor: true,
            username: username,
            message: "Mật khẩu đúng, vui lòng xác thực WebAuthn"
          },
        };
      }
      
      // Nếu không bật 2FA, trả token như bình thường
      const Access_token = await createAccessToken({
        id: isCheck._id,
        isAdmin: isCheck.isAdmin,
        isTeacher: isCheck.isTeacher,
        name: isCheck.name,
        username: isCheck.username,
        email: isCheck.email,
        phone: isCheck.phone,
      });
      const Refresh_token = await createRefreshToken({
        id: isCheck._id,
        isAdmin: isCheck.isAdmin,
        isTeacher: isCheck.isTeacher,
        name: isCheck.name,
        username: isCheck.username,
        email: isCheck.email,
        phone: isCheck.phone,
      });
      return {
        success: true,
        data: { userData: isCheck,Access_token, Refresh_token },
      };
    } else {
      // Sai mật khẩu: tăng bộ đếm và quyết định thời gian khóa giống iPhone
      const currentAttempts = isCheck.failedLoginAttempts || 0;
      const newAttempts = currentAttempts + 1;
      isCheck.failedLoginAttempts = newAttempts;

      let lockMinutes = 0;
      if (newAttempts >= 10) {
        // Sai >= 10 lần liên tiếp -> khóa 5 phút
        lockMinutes = 5;
      } else if (newAttempts >= 5) {
        // Sai >= 5 lần liên tiếp -> khóa 1 phút
        lockMinutes = 1;
      }

      if (lockMinutes > 0) {
        isCheck.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
      } else {
        isCheck.lockUntil = null;
      }

      await isCheck.save();

      return {
        success: false,
        message:
          lockMinutes > 0
            ? `Sai mật khẩu quá nhiều lần. Tài khoản bị khóa trong ${lockMinutes} phút`
            : `Mật khẩu không chính xác (đã sai ${newAttempts}/5 lần trước khi khóa 1 phút)`,
      };
    }
  } catch (e) {
    throw e;
  }
};

// const registOption = async (username) => {
//   const user = await User.findOne({ username });
//   if (user) {
//     return {
//       status: false,
//       message: "Username đã tồn tại",
//     };
//   }

//   const challenge = Buffer.from(Math.floor.toString(36)).toString("base64");

//   const option = {
//     challenge: challenge,
//     rp: {
//       name: "WebAuthn",
//       id: "localhost",
//     },
//     user: {
//       id: Buffer.from(username.toString(36)).toString("base64"),
//       name: username,
//       displayName: username,
//     },
//     pubKeyCredParams: [
//       { type: "public-key", alg: -7 },
//       { type: "public-key", alg: -257 },
//     ],
//     authenticatorSelection: {
//       authenticatorAttachment: "preferred",
//       userVerification: "preferred",
//     },
//     timeout: 60000,
//     attestation: "none",
//   };

//   if (option) console.log(`tao thanh cong option cho ${username}: `, option);
//   return {
//     status: true,
//     message: "Tao thanh cong option",
//     data: option,
//   };
// };

// const addRegister = async (username) => {
//   const user = await User.findOne({ username });

//   const challenge = Buffer.from(Math.floor.toString(36)).toString("base64");

//   const option = {
//     challenge: challenge,
//     rp: {
//       name: "WebAuthn",
//       id: "localhost",
//     },
//     user: {
//       id: Buffer.from(username.toString(36)).toString("base64"),
//       name: username,
//       displayName: username,
//     },
//     pubKeyCredParams: [
//       { type: "public-key", alg: -7 },
//       { type: "public-key", alg: -257 },
//     ],
//     authenticatorSelection: {
//       authenticatorAttachment: "preferred",
//       userVerification: "preferred",
//     },
//     timeout: 60000,
//     attestation: "none",
//   };

//   if (option) console.log(`tao thanh cong option cho ${username}: `, option);
//   return {
//     status: true,
//     message: "Tao thanh cong option",
//     data: option,
//   };
// };

// const registVerify = async ({ username, attResp }) => {
//   try {
//     if (attResp && attResp.id) {
//       const credential = {
//         credentialId: attResp.id,
//         name: "Thiết bị WebAuthn",
//         createdAt: new Date(),
//       };

//       const legacyCredential = {
//         id: attResp.id,
//         createAt: new Date(),
//       };

//       const user = await User.create({
//         username,
//         credential: legacyCredential,
//         credentials: [credential],
//         createdAt: new Date(),
//       });

//       return {
//         status: true,
//         message: "Verify đăng ký thành công",
//         credential,
//       };
//     }
//   } catch (err) {
//     console.log("Verify option đăng ký lỗi: ", err.message);
//     throw err;
//   }
// };

// const addVerify = async ({ username, attResp, deviceName }) => {
//   try {
//     console.log("Verify login for", username);
//     const user = await User.findOne({ username });
//     await ensureCredentialArray(user);

//     if (!user) {
//       console.log("Không tìm thấy user:", username);
//       return {
//         status: false,
//         message: "Không tìm thấy người dùng để lưu credential.",
//       };
//     }

//     if (attResp && attResp.id) {
//       const existed = user.credentials.some(
//         (credential) => credential.credentialId === attResp.id
//       );

//       if (existed) {
//         return {
//           status: false,
//           message: "Thiết bị đã tồn tại",
//           data: user.credentials,
//         };
//       }

//       const newCredential = {
//         credentialId: attResp.id,
//         name:
//           deviceName ||
//           `Thiết bị #${(user.credentials?.length || 0) + 1}`,
//         createdAt: new Date(),
//       };

//       user.credentials.push(newCredential);
//       await user.save();

//       console.log("Lưu credential thành công cho", username);
//     }

//     return {
//       status: true,
//       message: "Verify đăng ký thành công",
//       data: user.credentials,
//     };
//   } catch (err) {
//     console.log("Verify option đăng ký lỗi:", err.message);
//     throw err;
//   }
// };

// const loginOption = async (username) => {
//   try {
//     const user = await User.findOne({ username });
//     await ensureCredentialArray(user);

//     if (!user) {
//       throw new Error("User không tồn tại");
//     }

//     if (!user.credentials || user.credentials.length === 0) {
//       throw new Error("User chưa đăng ký thiết bị WebAuthn");
//     }

//     const challenge = Buffer.from(Math.random().toString(36)).toString(
//       "base64"
//     );

//     const options = {
//       challenge: challenge,
//       allowCredentials: user.credentials.map((credential) => ({
//         id: credential.credentialId,
//         type: "public-key",
//       })),
//       timeout: 60000,
//       userVerification: "preferred",
//     };

//     user.challenge = options.challenge;
//     await user.save();

//     console.log("Tao thanh cong option cho", username);
//     return options;
//   } catch (error) {
//     console.error("Error in OptionLogin:", error);
//     throw error;
//   }
// };
// const loginVerify = async ({ username, authResp }) => {
//   try {
//     const user = await User.findOne({ username });
//     await ensureCredentialArray(user);
//     if (!user) {
//       throw new Error("User khong ton tai");
//     }

//     if (authResp && authResp.id) {
//       //Cap nhat thong tin dang nhap
//       user.lastLoginAt = new Date();
//       user.loginCount += 1;
//       user.challenge = null; //Xoa challenge dang nhap sau khi da verify`
//       await user.save();
//       console.log("Verify thanh cong cho", username);

//       const access_token = await createAccessToken({
//         id: user.id,
//         isAdmin: user.isAdmin,
//       });
//       const Refresh_token = await createRefreshToken({
//         id: user.id,
//         isAdmin: user.isAdmin,
//       });
//       console.log("access_token", access_token);

//       return {
//         status: "success",
//         Access_token: access_token,
//         Refresh_token: Refresh_token,
//         userId: user._id,
//       };
//     }
//   } catch (error) {
//     console.error("Error in VerifyLogin:", error);
//     throw error;
//   }
// };

// // Xác thực bước 2 cho 2FA (sau khi đã xác thực mật khẩu)
// const loginVerifyTwoFactor = async ({ username, authResp }) => {
//   try {
//     const user = await User.findOne({ username });
//     await ensureCredentialArray(user);
//     if (!user) {
//       throw new Error("User khong ton tai");
//     }

//     // Kiểm tra user có bật 2FA không
//     if (!user.isTwoFactorAuth) {
//       throw new Error("User chua bat 2FA");
//     }

//     if (authResp && authResp.id) {
//       //Cap nhat thong tin dang nhap
//       user.lastLoginAt = new Date();
//       user.loginCount += 1;
//       user.challenge = null; //Xoa challenge dang nhap sau khi da verify`
//       await user.save();
//       console.log("Verify 2FA thanh cong cho", username);

//       const access_token = await createAccessToken({
//         id: user.id,
//         isAdmin: user.isAdmin,
//       });
//       const Refresh_token = await createRefreshToken({
//         id: user.id,
//         isAdmin: user.isAdmin,
//       });
//       console.log("access_token", access_token);

//       return {
//         status: "success",
//         Access_token: access_token,
//         Refresh_token: Refresh_token,
//         userId: user._id,
//       };
//     }
//   } catch (error) {
//     console.error("Error in VerifyLoginTwoFactor:", error);
//     throw error;
//   }
// };

// const getWebauthnCredentials = async (userId) => {
//   try {
//     const user = await User.findById(userId);
//     await ensureCredentialArray(user);

//     if (!user) {
//       return {
//         success: false,
//         message: "Không tìm thấy người dùng",
//       };
//     }

//     return {
//       success: true,
//       data: user.credentials || [],
//     };
//   } catch (error) {
//     throw error;
//   }
// };

// const removeWebauthnCredential = async ({ userId, credentialId }) => {
//   try {
//     const user = await User.findById(userId);
//     await ensureCredentialArray(user);

//     if (!user) {
//       return {
//         success: false,
//         message: "Không tìm thấy người dùng",
//       };
//     }

//     user.credentials = (user.credentials || []).filter(
//       (credential) => credential.credentialId !== credentialId
//     );
//     await user.save();

//     return {
//       success: true,
//       data: user.credentials,
//     };
//   } catch (error) {
//     throw error;
//   }
// };

// const renameWebauthnCredential = async ({ userId, credentialId, name }) => {
//   try {
//     const user = await User.findById(userId);
//     await ensureCredentialArray(user);

//     if (!user) {
//       return {
//         success: false,
//         message: "Không tìm thấy người dùng",
//       };
//     }

//     const credential = (user.credentials || []).find(
//       (item) => item.credentialId === credentialId
//     );

//     if (!credential) {
//       return {
//         success: false,
//         message: "Không tìm thấy thiết bị",
//       };
//     }

//     credential.name = name;
//     await user.save();

//     return {
//       success: true,
//       data: user.credentials,
//     };
//   } catch (error) {
//     throw error;
//   }
// };

const updateUser = async ({ id, data }) => {
  try {
    // Kiểm tra username tồn tại
    const isCheck = await User.findOne({ _id: id });
    if (!isCheck) {
      return {
        success: false,
        message: "Khong ton tai user",
      };
    }

    if (data && data.password) {
      // Nếu mật khẩu mới chưa được mã hóa bcrypt (bắt đầu bằng $2a$, $2b$, hoặc $2y$)
      if (!data.password.startsWith("$2a$") && !data.password.startsWith("$2b$") && !data.password.startsWith("$2y$")) {
        data.password = bcrypt.hashSync(data.password, 10);
      }
    }

    const updateUser = await User.findByIdAndUpdate(id, data, { new: true });
    return {
      success: true,
      data: updateUser,
    };
  } catch (e) {
    throw e;
  }
};

const deleteUser = async (id) => {
  try {
    // Kiểm tra username tồn tại
    const isCheck = await User.findOne({ _id: id });
    if (!isCheck) {
      return {
        success: false,
        message: "Khong ton tai user",
      };
    }

    const deleteUser = await User.findByIdAndDelete(id);
    return {
      success: true,
      data: deleteUser,
    };
  } catch (e) {
    throw e;
  }
};

const getAllUser = async () => {
  try {
    // Kiểm tra username tồn tại
    const allUser = await User.find();
    if (!allUser) {
      return {
        success: false,
        message: "Khong co du lieu all user",
      };
    }

    return {
      success: true,
      data: allUser,
    };
  } catch (e) {
    throw e;
  }
};

const getUser = async (id) => {
  try {
    console.log(id);
    // Kiểm tra username tồn tại
    const user = await User.findOne({ _id: id });
    console.log(user);
    if (!user) {
      return {
        success: false,
        message: "Khong ton tai user",
      };
    }
    return {
      success: true,
      data: user,
    };
  } catch (e) {
    throw e;
  }
};

// Quên mật khẩu: Bước 1 - Kiểm tra user có email hay SĐT
const checkUserForgotPassword = async ({ username }) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return { success: false, message: "Tên đăng nhập không tồn tại trong hệ thống!" };
    }

    const hasEmail = Boolean(user.email && user.email.trim() !== "");
    const hasPhone = Boolean(user.phone && user.phone.trim() !== "");

    if (!hasEmail && !hasPhone) {
      return { success: false, message: "Tài khoản này chưa liên kết Email hay Số điện thoại, không thể khôi phục mật khẩu tự động!" };
    }

    // Mask email (ví dụ: t***@gmail.com)
    let emailMasked = "";
    if (hasEmail) {
      const parts = user.email.split("@");
      if (parts.length === 2) {
        const namePart = parts[0];
        const maskedName = namePart.length > 2 ? namePart[0] + "***" + namePart.slice(-1) : namePart[0] + "***";
        emailMasked = `${maskedName}@${parts[1]}`;
      } else {
        emailMasked = user.email;
      }
    }

    // Mask phone (ví dụ: 098***123)
    let phoneMasked = "";
    if (hasPhone) {
      const p = user.phone;
      phoneMasked = p.length > 6 ? p.slice(0, 3) + "***" + p.slice(-3) : p;
    }

    return {
      success: true,
      data: {
        username: user.username,
        hasEmail,
        emailMasked,
        hasPhone,
        phoneMasked,
      },
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

// Quên mật khẩu: Bước 2 - Gửi OTP (Thật tới Email & Số điện thoại)
const sendOtpForgotPassword = async ({ username, method }) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return { success: false, message: "Tài khoản không tồn tại!" };
    }

    // Tạo OTP 6 số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    user.resetOtp = {
      code: otpCode,
      expiresAt: expiresAt,
      method: method,
    };
    await user.save();

    console.log(`[FORGOT PASSWORD OTP] Username: ${username} | Method: ${method} | OTP Code: ${otpCode}`);

    // --- 1. GỬI OTP QUA EMAIL (THẬT) ---
    if (method === "email") {
      const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
      const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
      const emailHost = process.env.SMTP_HOST || "smtp.gmail.com";
      const emailPort = process.env.SMTP_PORT || 465;

      if (emailUser && emailPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: emailHost,
            port: Number(emailPort),
            secure: Number(emailPort) === 465, // true với 465, false với các cổng khác
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          });

          const mailOptions = {
            from: `"Hệ thống E-Learning" <${emailUser}>`,
            to: user.email,
            subject: "[E-Learning] Mã OTP Khôi phục Mật khẩu",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #f15a24 0%, #d94e1d 100%); padding: 24px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: bold;">HỆ THỐNG E-LEARNING</h1>
                  <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Khôi phục mật khẩu tài khoản</p>
                </div>
                <div style="padding: 32px 24px; background-color: #ffffff; color: #334155;">
                  <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${user.name || user.username}</strong>,</p>
                  <p style="font-size: 15px; line-height: 1.6;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong style="color: #f15a24;">${user.username}</strong> của bạn.</p>
                  <p style="font-size: 15px; line-height: 1.6;">Dưới đây là mã OTP xác thực của bạn. Mã này có hiệu lực trong vòng <strong>5 phút</strong>:</p>
                  
                  <div style="background-color: #fff7ed; border: 2px dashed #fdba74; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ea580c;">${otpCode}</span>
                  </div>
                  
                  <p style="font-size: 13px; color: #64748b; margin-bottom: 0;"><em>* Lưu ý: Không chia sẻ mã OTP này cho bất kỳ ai, kể cả nhân viên hỗ trợ để tránh rủi ro mất tài khoản.</em></p>
                </div>
                <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0;">© 2026 E-Learning Platform. All rights reserved.</p>
                </div>
              </div>
            `,
          };

          await transporter.sendMail(mailOptions);
          console.log(`[REAL EMAIL SENT] Đã gửi mail OTP thành công tới: ${user.email}`);
        } catch (mailErr) {
          console.error(`[REAL EMAIL ERROR] Lỗi gửi mail tới ${user.email}:`, mailErr.message);
        }
      } else {
        console.log(`[NOTE] Để gửi Email thật, cần cấu hình EMAIL_USER và EMAIL_PASS trong file .env`);
      }
    }

    // --- 2. GỬI OTP QUA SỐ ĐIỆN THOẠI / SMS (THẬT) ---
    if (method === "phone") {
      // Ưu tiên 1: Twilio SMS API (Quốc tế & VN)
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
          const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          let formattedPhone = user.phone;
          if (formattedPhone.startsWith("0")) {
            formattedPhone = "+84" + formattedPhone.slice(1);
          }
          await twilio.messages.create({
            body: `[E-Learning] Ma OTP khoi phuc mat khau cua ban la: ${otpCode}. Hieu luc trong 5 phut.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone,
          });
          console.log(`[REAL SMS SENT] Đã gửi SMS Twilio thành công tới: ${formattedPhone}`);
        } catch (smsErr) {
          console.error(`[TWILIO SMS ERROR] Lỗi gửi SMS tới ${user.phone}:`, smsErr.message);
        }
      }
      // Ưu tiên 2: SpeedSMS (Gateway phổ biến tại Việt Nam)
      else if (process.env.SPEEDSMS_ACCESS_TOKEN) {
        try {
          const url = `https://api.speedsms.vn/index.php/sms/send?access-token=${process.env.SPEEDSMS_ACCESS_TOKEN}&to=${user.phone}&content=${encodeURIComponent(`[E-Learning] Ma OTP khoi phuc mat khau cua ban la ${otpCode}. Hieu luc 5 phut.`)}&type=4`;
          const resSms = await axios.get(url);
          console.log(`[REAL SMS SENT] SpeedSMS Response tới ${user.phone}:`, resSms.data);
        } catch (smsErr) {
          console.error(`[SPEEDSMS ERROR] Lỗi gửi SMS SpeedSMS tới ${user.phone}:`, smsErr.message);
        }
      } else {
        console.log(`[NOTE] Để gửi SMS thật, cần cấu hình TWILIO_* hoặc SPEEDSMS_ACCESS_TOKEN trong file .env`);
      }
    }

    return {
      success: true,
      message: method === 'email' ? "Mã OTP đã được gửi về Email của bạn" : "Mã OTP đã được gửi về Số điện thoại của bạn",
      devOtp: otpCode, // Trả kèm devOtp để đảm bảo test luôn mượt mà trong lúc cấu hình
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

// Quên mật khẩu: Bước 3 - Xác minh OTP
const verifyOtpForgotPassword = async ({ username, otp }) => {
  try {
    const user = await User.findOne({ username });
    if (!user || !user.resetOtp || !user.resetOtp.code) {
      return { success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn!" };
    }

    if (user.resetOtp.expiresAt < new Date()) {
      return { success: false, message: "Mã OTP đã hết hạn, vui lòng gửi lại mã mới!" };
    }

    if (user.resetOtp.code !== String(otp).trim()) {
      return { success: false, message: "Mã OTP không chính xác!" };
    }

    return {
      success: true,
      message: "Xác minh OTP thành công!",
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

// Quên mật khẩu: Bước 4 - Đặt lại mật khẩu mới
const resetPasswordWithOtp = async ({ username, otp, newPassword }) => {
  try {
    const user = await User.findOne({ username });
    if (!user || !user.resetOtp || !user.resetOtp.code) {
      return { success: false, message: "Phiên đặt lại mật khẩu không hợp lệ, vui lòng thực hiện lại từ đầu!" };
    }

    if (user.resetOtp.expiresAt < new Date()) {
      return { success: false, message: "Mã OTP đã hết hạn, vui lòng thực hiện lại!" };
    }

    if (user.resetOtp.code !== String(otp).trim()) {
      return { success: false, message: "Mã OTP xác thực không đúng!" };
    }

    // Mã hóa mật khẩu mới
    user.password = bcrypt.hashSync(newPassword, 10);
    // Xóa OTP & mở khóa tài khoản nếu đang bị khóa
    user.resetOtp = { code: null, expiresAt: null, method: null };
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    return {
      success: true,
      message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.",
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

module.exports = {
  createUser,
  signinUser,
  updateUser,
  deleteUser,
  getAllUser,
  getUser,
  checkUserForgotPassword,
  sendOtpForgotPassword,
  verifyOtpForgotPassword,
  resetPasswordWithOtp,
};
