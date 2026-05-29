const { VNPay } = require("vnpay");

const tmnCode = "AFPGH33E";

const secrets = [
  "X36HLAV241E67RGG7G5OJ2HSUKBWP2L0", // 1. Original
  "X36HLAV241E67RGG7G50J2HSUKBWP2L0", // 2. Zero at character 20
  "X36HLAV241E67RGG7G5OJ2HSUKBWP2LO", // 3. O at character 32
  "X36HLAV241E67RGG7G50J2HSUKBWP2LO"  // 4. Zero at 20, O at 32
];

console.log("Generating SHA512 URLs for different combinations...");

secrets.forEach((secret, index) => {
  const vnpay = new VNPay({
    tmnCode,
    secureSecret: secret,
    vnpayHost: "https://sandbox.vnpayment.vn",
    hashAlgorithm: "SHA512",
  });

  const url = vnpay.buildPaymentUrl({
    vnp_Amount: 50000,
    vnp_IpAddr: "127.0.0.1",
    vnp_TxnRef: "comb_" + index + "_" + Date.now(),
    vnp_OrderInfo: "test info",
    vnp_ReturnUrl: "http://localhost:3000/thanh-toan/vnpay-callback",
  });

  console.log(`\nCombination ${index + 1} (Secret: ${secret}):`);
  console.log(url);
});
