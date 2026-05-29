const { VNPay } = require("vnpay");

const vnpay = new VNPay({
  tmnCode: "AFPGH33E",
  secureSecret: "X36HLAV241E67RGG7G5OJ2HSUKBWP2L0",
  vnpayHost: "https://sandbox.vnpayment.vn",
});

const paymentUrl = vnpay.buildPaymentUrl({
  vnp_Amount: 50000,
  vnp_IpAddr: "127.0.0.1",
  vnp_TxnRef: "test_" + Date.now(),
  vnp_OrderInfo: "test info",
  vnp_ReturnUrl: "http://localhost:3000/thanh-toan/vnpay-callback",
});

console.log("Generated Payment URL:");
console.log(paymentUrl);
