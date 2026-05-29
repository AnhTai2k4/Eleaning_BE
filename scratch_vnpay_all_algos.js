const { VNPay } = require("vnpay");

const tmnCode = "AFPGH33E";
const secureSecret = "X36HLAV241E67RGG7G5OJ2HSUKBWP2L0";

// Test SHA512
const vnpay512 = new VNPay({
  tmnCode,
  secureSecret,
  vnpayHost: "https://sandbox.vnpayment.vn",
  hashAlgorithm: "SHA512",
});

const url512 = vnpay512.buildPaymentUrl({
  vnp_Amount: 50000,
  vnp_IpAddr: "127.0.0.1",
  vnp_TxnRef: "test_" + Date.now(),
  vnp_OrderInfo: "test info",
  vnp_ReturnUrl: "http://localhost:3000/thanh-toan/vnpay-callback",
});

// Test SHA256
const vnpay256 = new VNPay({
  tmnCode,
  secureSecret,
  vnpayHost: "https://sandbox.vnpayment.vn",
  hashAlgorithm: "SHA256",
});

const url256 = vnpay256.buildPaymentUrl({
  vnp_Amount: 50000,
  vnp_IpAddr: "127.0.0.1",
  vnp_TxnRef: "test_" + (Date.now() + 1),
  vnp_OrderInfo: "test info",
  vnp_ReturnUrl: "http://localhost:3000/thanh-toan/vnpay-callback",
});

console.log("SHA512 URL:");
console.log(url512);
console.log("\nSHA256 URL:");
console.log(url256);
