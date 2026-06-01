const { VNPay } = require('vnpay');

const tmnCode = 'GKSWJ3QC';
const secret = 'EJ55B4RE14FBBVBL6C52RIWBVOYE13V6';
const reference = 'TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0';
const amount = 5000000;
const returnUrl = 'http://localhost:5173/topup/vnpay-callback';
// Use the current date to make it realistic
const date = new Date();
const pad = (n) => String(n).padStart(2, '0');
const createDate =
  date.getFullYear() +
  pad(date.getMonth() + 1) +
  pad(date.getDate()) +
  pad(date.getHours()) +
  pad(date.getMinutes()) +
  pad(date.getSeconds());

const vnpay = new VNPay({
  tmnCode: tmnCode,
  secureSecret: secret,
  vnpayHost: 'https://sandbox.vnpayment.vn',
});

const paymentUrl = vnpay.buildPaymentUrl({
  vnp_Amount: amount, // amount in VND
  vnp_IpAddr: '127.0.0.1',
  vnp_TxnRef: reference,
  vnp_OrderInfo: `Nap_tien_vi_HKi_Wallet_${reference}`,
  vnp_OrderType: 'other',
  vnp_ReturnUrl: returnUrl,
  vnp_CreateDate: createDate,
});

console.log('Generated URL:', paymentUrl);

async function test() {
  try {
    const res = await fetch(paymentUrl);
    const html = await res.text();
    if (html.includes('Invalid signature') || html.includes('Sai chữ ký')) {
      console.log('Result: INVALID SIGNATURE');
    } else {
      console.log('Result: VALID SIGNATURE!');
    }
  } catch (e) {
    console.log('Error requesting URL:', e.message);
  }
}

test();
