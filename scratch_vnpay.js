const crypto = require("crypto");

// Simple sort function that doesn't encode keys or values
function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

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
  const txnRef = `testuser_testcourse_${date.getTime()}`;
  const amount = 50000;

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = txnRef;
  vnp_Params["vnp_OrderInfo"] = "test";
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;

  // 1. Sort parameters alphabetically by key
  const sortedParams = sortObject(vnp_Params);

  // 2. Build signData using RAW (unencoded) values
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join("&");

  // 3. Compute HMAC-SHA512 signature
  const hmac = crypto.createHmac("sha512", secretKey);
  const secureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  // 4. Build redirect URL with URL-encoded values
  const encodedParams = {};
  for (let key in sortedParams) {
    encodedParams[encodeURIComponent(key)] = encodeURIComponent(sortedParams[key]).replace(/%20/g, "+");
  }
  encodedParams["vnp_SecureHash"] = secureHash;

  const paymentUrl =
    vnpUrl +
    "?" +
    Object.keys(encodedParams)
      .map((key) => `${key}=${encodedParams[key]}`)
      .join("&");

  console.log("signData (raw):", signData);
  console.log("secureHash:", secureHash);
  console.log("paymentUrl:", paymentUrl);
}

testVnpay();
