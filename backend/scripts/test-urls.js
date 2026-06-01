const urls = {
  SHA512_lower: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=500000000&vnp_Command=pay&vnp_CreateDate=20260601122530&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Nap_tien_vi_HKi_Wallet_TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Ftopup%2Fvnpay-callback&vnp_TmnCode=GKSWJ3QC&vnp_TxnRef=TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_Version=2.1.0&vnp_SecureHash=bcd73315680fef1b13c2f6968a70d6d8a66266419e82bb52ac0485a777c5bbdd2553163e00e47f9c041bd2369b02d90c78f6b69cbbd40c22186bffdc6c082779',
  SHA512_upper: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=500000000&vnp_Command=pay&vnp_CreateDate=20260601122530&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Nap_tien_vi_HKi_Wallet_TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Ftopup%2Fvnpay-callback&vnp_TmnCode=GKSWJ3QC&vnp_TxnRef=TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_Version=2.1.0&vnp_SecureHash=BCD73315680FEF1B13C2F6968A70D6D8A66266419E82BB52AC0485A777C5BBDD2553163E00E47F9C041BD2369B02D90C78f6b69cbbd40c22186bffdc6c082779',
  SHA256_lower: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=500000000&vnp_Command=pay&vnp_CreateDate=20260601122530&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Nap_tien_vi_HKi_Wallet_TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Ftopup%2Fvnpay-callback&vnp_TmnCode=GKSWJ3QC&vnp_TxnRef=TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_Version=2.1.0&vnp_SecureHash=2d959ff3169a0e583b7307b9bd7b9b23e77240a78ccdbb6724abd1170c97df3c',
  SHA256_upper: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=500000000&vnp_Command=pay&vnp_CreateDate=20260601122530&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Nap_tien_vi_HKi_Wallet_TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Ftopup%2Fvnpay-callback&vnp_TmnCode=GKSWJ3QC&vnp_TxnRef=TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_Version=2.1.0&vnp_SecureHash=2D959FF3169A0E583B7307B9BD7B9B23E77240A78CCDBB6724ABD1170C97DF3C',
  MD5_lower: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=500000000&vnp_Command=pay&vnp_CreateDate=20260601122530&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Nap_tien_vi_HKi_Wallet_TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Ftopup%2Fvnpay-callback&vnp_TmnCode=GKSWJ3QC&vnp_TxnRef=TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_Version=2.1.0&vnp_SecureHash=d1101cb413d3ac4398515b1b89d184e5',
  MD5_upper: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=500000000&vnp_Command=pay&vnp_CreateDate=20260601122530&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Nap_tien_vi_HKi_Wallet_TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Ftopup%2Fvnpay-callback&vnp_TmnCode=GKSWJ3QC&vnp_TxnRef=TOP-e0fb14be-4f51-41d3-a664-df0a19ca47b0&vnp_Version=2.1.0&vnp_SecureHash=D1101CB413D3AC4398515B1B89D184E5',
};

async function test() {
  for (const [name, url] of Object.entries(urls)) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const html = await res.text();
      if (html.includes('Invalid signature') || html.includes('Sai chữ ký')) {
        console.log(`${name}: Invalid signature`);
      } else {
        console.log(`${name}: VALID SIGNATURE! (Response contains: ${html.includes('Giao dịch hết hạn') ? 'Expired transaction' : 'Success/Other'})`);
      }
    } catch (e) {
      console.log(`${name}: Error requesting:`, e.message);
    }
  }
}

test();
