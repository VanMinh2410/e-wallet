const crypto = require('crypto');

const tmnCode = 'GKSWJ3QC';
const secret = 'VW2JLNKQ2XE384ZSSFOT3XRPHMPS7EGI';
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
const signData = sortedKeys
  .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  .join('&');

async function testAlgo(name, algo, uppercase) {
  const hmac = crypto.createHmac(algo, secret);
  let hash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  if (uppercase) hash = hash.toUpperCase();

  const url = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${hash}`;
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
  await testAlgo('SHA512 Lower', 'sha512', false);
  await testAlgo('SHA512 Upper', 'sha512', true);
  await testAlgo('SHA256 Lower', 'sha256', false);
  await testAlgo('SHA256 Upper', 'sha256', true);
}

run();
