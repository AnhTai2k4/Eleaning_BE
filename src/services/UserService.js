const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const { createAccessToken, createRefreshToken } = require("./JwtService");

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
      return {
        success: false,
        message: `Tài khoản đang bị khóa, vui lòng thử lại sau ${remainingSec} giây`,
      };
    }

    const comparePassword = await bcrypt.compare(password, isCheck.password);
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
      } else if (newAttempts >= 3) {
        // Sai >= 3 lần liên tiếp -> khóa 1 phút
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
            : "Mat khau khong hop le",
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

module.exports = {
  createUser,
 
  signinUser,


  updateUser,
  deleteUser,
  getAllUser,
  getUser,
};
