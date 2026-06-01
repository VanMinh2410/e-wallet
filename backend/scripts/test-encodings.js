const crypto = require('crypto');

const tmnCode = 'GKSWJ3QC';
const secret = 'EJ55B4RE14FBBVBL6C52RIWBVOYE13V6';
const reference = 'TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0';
const amount = 5000000;
const returnUrl = 'http://localhost:5173/topup/vnpay-callback';

const date = new Date();
const pad = (n) => String(n).padStart(2, '0');
const createDate =
  date.getFullYear() +
  pad(date.getMonth() + 1) +
  pad(date.getDate()) +
  pad(date.getHours()) +
  pad(date.getMinutes()) +
  pad(date.getSeconds());

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

// Helper to test a specific signData and URL format
async function testFormat(name, signData, queryString) {
  const hmac = crypto.createHmac('sha512', secret);
  const hash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex').toUpperCase();

  const url = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${queryString}&vnp_SecureHash=${hash}`;
  try {
    const res = await fetch(url);
    const html = await res.text();
    if (html.includes('Invalid signature') || html.includes('Sai chữ ký')) {
      console.log(`${name}: INVALID`);
    } else {
      console.log(`${name}: VALID!`);
    }
  } catch (e) {
    console.log(`${name}: Error:`, e.message);
  }
}

async function run() {
  // Format A: Standard (uppercase encodeURIComponent for both signData and queryString)
  const signDataA = sortedKeys
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  await testFormat('Format A (Standard)', signDataA, signDataA);

  // Format B: Raw values in signData, encoded in queryString
  const signDataB = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  const queryStrB = sortedKeys
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  await testFormat('Format B (Raw in hash, encoded in query)', signDataB, queryStrB);

  // Format C: Lowercase percent encoding in both signData and queryString
  const signDataC = sortedKeys
    .map((key) => {
      const encVal = encodeURIComponent(params[key]).replace(/%[0-9A-F]{2}/g, (match) => match.toLowerCase());
      return `${key}=${encVal}`;
    })
    .join('&');
  await testFormat('Format C (Lowercase % encoding)', signDataC, signDataC);

  // Format D: No encoding of return URL in signData, but encoded in query
  // Wait, let's see if that's what some people do
}

run();
