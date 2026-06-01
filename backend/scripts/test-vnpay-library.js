const { VNPay, HashAlgorithm } = require('vnpay');
const crypto = require('crypto');

const tmnCode = 'GKSWJ3QC';
const secret = 'VW2JLNKQ2XE384ZSSFOT3XRPHMPS7EGI';
const reference = 'TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0';
const amount = 5000000;
const returnUrl = 'http://localhost:5173/topup/vnpay-callback';
const createDate = '20260601122530';

const params = {
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_TmnCode: tmnCode,
  vnp_Locale: 'vn',
  vnp_CurrCode: 'VND',
  vnp_TxnRef: reference,
  vnp_OrderInfo: `Nap_tien_vi_HKi_Wallet_${reference}`,
  vnp_OrderType: 'other',
  vnp_Amount: String(amount * 100),
  vnp_ReturnUrl: returnUrl,
  vnp_IpAddr: '127.0.0.1',
  vnp_CreateDate: createDate,
};

const sortedKeys = Object.keys(params).sort();
const signData = sortedKeys
  .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  .join('&');

// Let's test SHA512 (lowercase and uppercase)
const hmac512 = crypto.createHmac('sha512', secret);
const hash512_lower = hmac512.update(Buffer.from(signData, 'utf-8')).digest('hex');
const hash512_upper = hash512_lower.toUpperCase();

// Let's test SHA256 (lowercase and uppercase)
const hmac256 = crypto.createHmac('sha256', secret);
const hash256_lower = hmac256.update(Buffer.from(signData, 'utf-8')).digest('hex');
const hash256_upper = hash256_lower.toUpperCase();

// Let's test MD5 (lowercase and uppercase)
const hmacMD5 = crypto.createHmac('md5', secret);
const hashMD5_lower = hmacMD5.update(Buffer.from(signData, 'utf-8')).digest('hex');
const hashMD5_upper = hashMD5_lower.toUpperCase();

console.log('SHA512 Lower URL:', `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${hash512_lower}`);
console.log('SHA512 Upper URL:', `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${hash512_upper}`);
console.log('SHA256 Lower URL:', `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${hash256_lower}`);
console.log('SHA256 Upper URL:', `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${hash256_upper}`);
console.log('MD5 Lower URL:', `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${hashMD5_lower}`);
console.log('MD5 Upper URL:', `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${hashMD5_upper}`);
