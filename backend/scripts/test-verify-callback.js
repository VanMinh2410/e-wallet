const crypto = require('crypto');

const secret = 'EJ55B4RE14FBBVBL6C52RIWBVOYE13V6';

const queryParams = {
  vnp_Amount: '500000000',
  vnp_BankCode: 'NCB',
  vnp_BankTranNo: 'VNP14828114',
  vnp_CardType: 'ATM',
  vnp_OrderInfo: 'Nap_tien_vi_HKi_Wallet_TOP-73ca3575-ee5a-44a2-825b-2db6abb1efea',
  vnp_PayDate: '20260601125345',
  vnp_ResponseCode: '00',
  vnp_TmnCode: 'GKSWJ3QC',
  vnp_TransactionNo: '14828114',
  vnp_TransactionStatus: '00',
  vnp_TxnRef: 'TOP-73ca3575-ee5a-44a2-825b-2db6abb1efea',
};

// 1. Sort and hash like VNPay does to generate the callback secureHash
const sortedKeys = Object.keys(queryParams).sort();
const signData = sortedKeys
  .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
  .join('&');

const hmac = crypto.createHmac('sha512', secret);
const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex').toUpperCase();

console.log('Generated callback SecureHash:', secureHash);

// 2. Verify it using our backend verification logic
const params = { ...queryParams };
// (no secureHash here since we delete it in backend)

const sortedKeys2 = Object.keys(params).sort();
const signData2 = sortedKeys2
  .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  .join('&');

const hmac2 = crypto.createHmac('sha512', secret);
const expectedHash = hmac2.update(Buffer.from(signData2, 'utf-8')).digest('hex');

console.log('expectedHash:', expectedHash);
console.log('Is valid?', secureHash.toLowerCase() === expectedHash.toLowerCase());
