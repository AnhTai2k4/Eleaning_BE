const crypto = require("crypto");

function testVnpay() {
  const tmnCode = "AFPGH33E";
  const secretKey = "X36HLAV241E67RGG7G5OJ2HSUKBWP2L0";
  const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = "http://localhost:3000/thanh-toan/vnpay-callback";
  
  const ipAddr = "127.0.0.1";
  
  const date = new Date();
  const pad = (n) => (n < 10 ? "0" + n : n);
  const createDate = 
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds());
  
  const txnRef = "fresh_" + date.getTime();
  const amount = 50000;

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = txnRef;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan khoa hoc ToanMath 10";
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;

  // Use URLSearchParams to sort and encode parameters exactly as the library does
  const params = new URLSearchParams();
  const sortedKeys = Object.keys(vnp_Params).sort();
  for (const key of sortedKeys) {
    if (vnp_Params[key] !== undefined && vnp_Params[key] !== null && vnp_Params[key] !== "") {
      params.append(key, String(vnp_Params[key]));
    }
  }

  const signData = params.toString();

  const hmac = crypto.createHmac("sha512", secretKey);
  const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  params.append("vnp_SecureHash", secureHash);

  const paymentUrl = vnpUrl + "?" + params.toString();

  console.log("FINAL URL:");
  console.log(paymentUrl);
}

testVnpay();
