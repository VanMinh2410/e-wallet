import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../shared/services/api';
import styles from './VnpayMockPage.module.css';

interface BankInfo {
  code: string;
  name: string;
  logo?: string;
  bin?: string;
  shortName?: string;
}

const STATIC_FALLBACK_BANKS: BankInfo[] = [
  { code: 'VCB', name: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png' },
  { code: 'ICB', name: 'VietinBank', logo: 'https://api.vietqr.io/img/ICB.png' },
  { code: 'BIDV', name: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { code: 'VBA', name: 'Agribank', logo: 'https://api.vietqr.io/img/VBA.png' },
  { code: 'STB', name: 'Sacombank', logo: 'https://api.vietqr.io/img/STB.png' },
  { code: 'MB', name: 'MBBank', logo: 'https://api.vietqr.io/img/MB.png' },
  { code: 'TCB', name: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png' },
  { code: 'ACB', name: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { code: 'VPB', name: 'VPBank', logo: 'https://api.vietqr.io/img/VPB.png' },
  { code: 'DAB', name: 'DongA Bank', logo: 'https://api.vietqr.io/img/DAB.png' },
  { code: 'SHB', name: 'SHB', logo: 'https://api.vietqr.io/img/SHB.png' },
  { code: 'EIB', name: 'Eximbank', logo: 'https://api.vietqr.io/img/EIB.png' },
  { code: 'TPB', name: 'TPBank', logo: 'https://api.vietqr.io/img/TPB.png' },
  { code: 'NCB', name: 'NCB', logo: 'https://api.vietqr.io/img/NCB.png' },
  { code: 'MSB', name: 'MSB', logo: 'https://api.vietqr.io/img/MSB.png' },
  { code: 'HDB', name: 'HDBank', logo: 'https://api.vietqr.io/img/HDB.png' },
  { code: 'NAB', name: 'Nam A Bank', logo: 'https://api.vietqr.io/img/NAB.png' },
  { code: 'OCB', name: 'OCB', logo: 'https://api.vietqr.io/img/OCB.png' },
  { code: 'SCB', name: 'SCB', logo: 'https://api.vietqr.io/img/SCB.png' },
  { code: 'ABB', name: 'ABBank', logo: 'https://api.vietqr.io/img/ABB.png' },
  { code: 'VIB', name: 'VIB', logo: 'https://api.vietqr.io/img/VIB.png' },
  { code: 'SGB', name: 'SaigonBank', logo: 'https://api.vietqr.io/img/SGB.png' },
  { code: 'PVC', name: 'PVcomBank', logo: 'https://api.vietqr.io/img/PVC.png' },
  { code: 'HSBC', name: 'HSBC', logo: 'https://api.vietqr.io/img/HSBC.png' },
  { code: 'BVB', name: 'BVBank', logo: 'https://api.vietqr.io/img/BVB.png' },
  { code: 'SEAB', name: 'SeABank', logo: 'https://api.vietqr.io/img/SEAB.png' },
  { code: 'BAB', name: 'Bac A Bank', logo: 'https://api.vietqr.io/img/BAB.png' },
  { code: 'VAB', name: 'Viet A Bank', logo: 'https://api.vietqr.io/img/VAB.png' },
  { code: 'KLB', name: 'KienlongBank', logo: 'https://api.vietqr.io/img/KLB.png' },
  { code: 'LPB', name: 'LPBank', logo: 'https://api.vietqr.io/img/LPB.png' },
  { code: 'PGB', name: 'PGBank', logo: 'https://api.vietqr.io/img/PGB.png' },
  { code: 'GPB', name: 'GPBank', logo: 'https://api.vietqr.io/img/GPB.png' },
];

export function VnpayMockPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Flow State: 'method_select' | 'bank_select' | 'checkout' | 'otp_verify'
  const [currentStep, setCurrentStep] = useState<'method_select' | 'bank_select' | 'checkout' | 'otp_verify'>('method_select');
  
  // Selected payment method: 'qr' | 'atm' | 'intl' | 'vn_app'
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'atm' | 'intl' | 'vn_app' | null>(null);

  // Accordion active state for Step 1
  const [activeAccordion, setActiveAccordion] = useState<'qr' | 'atm' | 'intl' | 'vn_app' | null>('atm');
  
  const [banks, setBanks] = useState<BankInfo[]>(STATIC_FALLBACK_BANKS);
  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ATM Card Form States (starts empty)
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [formError, setFormError] = useState('');

  // OTP Verification States
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  // Is this preset card insufficient balance?
  const [isInsufficientBalance, setIsInsufficientBalance] = useState(false);

  const [maskedEmail, setMaskedEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Live Timer Countdowns (15 minutes)
  const [timeLeft, setTimeLeft] = useState(900);

  const vnpAmountStr = searchParams.get('vnp_Amount');
  const amount = vnpAmountStr ? Number(vnpAmountStr) / 100 : 0;
  const txnRef = searchParams.get('vnp_TxnRef');
  const orderInfo = searchParams.get('vnp_OrderInfo') || '';
  const returnUrl = searchParams.get('vnp_ReturnUrl');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const json = await response.json();
        if (json && json.code === '00' && Array.isArray(json.data)) {
          const mapped = json.data.map((item: any) => ({
            code: item.code,
            name: item.name,
            logo: item.logo,
            bin: item.bin,
            shortName: item.shortName || item.code
          }));
          setBanks(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch banks from VietQR:', err);
      }
    };
    fetchBanks();
  }, []);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      minutes: pad(m).split(''),
      seconds: pad(sec).split(''),
    };
  };

  const timerParts = formatTimer(timeLeft);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val);
  };

  // Preset Card Selectors
  const applyPreset = (type: 'success' | 'fail_balance') => {
    setFormError('');
    if (type === 'success') {
      setCardNumber('970419852613143212');
      setCardHolder('NGUYEN VAN A');
      setIssueDate('07/15');
      setIsInsufficientBalance(false);
    } else {
      setCardNumber('970419133333333333');
      setCardHolder('NGUYEN VAN A');
      setIssueDate('07/15');
      setIsInsufficientBalance(true);
    }
  };

  const requestOtpAndTransition = async () => {
    setLoading(true);
    setFormError('');
    setOtpError('');
    try {
      const response = await api.post('/transactions/vnpay-mock/send-otp', {
        vnp_TxnRef: txnRef,
      });
      const resData = response.data;
      const data = resData && typeof resData === 'object' && 'data' in resData ? resData.data : resData;
      
      setMaskedEmail(data?.email || '');
      setEmailSent(!!data?.emailSent);
      setIsDebugMode(true);

      setCurrentStep('otp_verify');
      setOtpCode('');
      setOtpError('');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Không thể tạo mã OTP giao dịch.';
      setFormError(errMsg);
      setOtpError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    setFormError('');
    if (cardNumber.length < 12) {
      setFormError('Số thẻ không hợp lệ (tối thiểu 12 số).');
      return;
    }
    if (!cardHolder.trim()) {
      setFormError('Vui lòng nhập tên chủ thẻ.');
      return;
    }
    if (!issueDate.trim() || !issueDate.includes('/')) {
      setFormError('Vui lòng nhập ngày phát hành (MM/YY).');
      return;
    }

    await requestOtpAndTransition();
  };

  const handleConfirmOtp = async () => {
    if (!otpCode.trim()) {
      setOtpError('Vui lòng nhập mã OTP.');
      return;
    }

    setLoading(true);
    setOtpError('');
    try {
      await api.post('/transactions/vnpay-mock/verify-otp', {
        vnp_TxnRef: txnRef,
        otpCode,
      });

      if (isInsufficientBalance) {
        await executeCallback('fail_balance');
      } else {
        await executeCallback('success');
      }
    } catch (err: any) {
      console.error(err);
      setOtpError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      setLoading(false);
    }
  };

  const executeCallback = async (status: 'success' | 'fail' | 'fail_balance') => {
    if (!vnpAmountStr || !txnRef || !returnUrl) {
      alert('Thông tin giao dịch không đầy đủ.');
      return;
    }

    setLoading(true);
    try {
      const payloadStatus = status === 'success' ? 'success' : 'fail';
      
      const response = await api.post('/transactions/vnpay-mock/sign', {
        vnp_Amount: vnpAmountStr,
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: orderInfo,
        vnp_ReturnUrl: returnUrl,
        status: payloadStatus,
      });

      const resData = response.data;
      const data = resData && typeof resData === 'object' && 'data' in resData ? resData.data : resData;

      if (data?.callbackUrl) {
        let finalUrl = data.callbackUrl;
        
        if (status === 'fail_balance') {
          finalUrl = finalUrl
            .replace('vnp_ResponseCode=00', 'vnp_ResponseCode=51')
            .replace('vnp_TransactionStatus=00', 'vnp_TransactionStatus=02');
        }

        window.location.href = finalUrl;
      } else {
        alert('Lỗi: Server không phản hồi URL callback.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối server giả lập ký thanh toán.');
      setLoading(false);
    }
  };

  // Back Button Navigation
  const handleGoBack = () => {
    if (currentStep === 'otp_verify') {
      setCurrentStep('checkout');
    } else if (currentStep === 'checkout') {
      setCurrentStep('method_select');
    } else if (currentStep === 'bank_select') {
      setCurrentStep('method_select');
    } else {
      // Show cancel overlay
      setShowCancelModal(true);
    }
  };

  if (!txnRef || !vnpAmountStr) {
    return (
      <div className={styles.container}>
        <div className={styles.portalCard}>
          <div className={styles.header}>
            <div className={styles.logoArea}>
              <span className={styles.vnpayIcon}>VNPAY</span>
              <span className={styles.badge}>LOCAL MOCK</span>
            </div>
            <div className={styles.tagline}>CỔNG THANH TOÁN GIẢ LẬP</div>
          </div>
          <div className={styles.content} style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h3 style={{ color: '#ef4444', marginBottom: 12 }}>Yêu cầu thanh toán không hợp lệ</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Không tìm thấy mã tham chiếu giao dịch hoặc số tiền thanh toán trong URL. Vui lòng quay lại ví và thử lại.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bank.shortName && bank.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.container}>
      {/* Top back/lang header bar */}
      <div className={styles.topBar}>
        <button type="button" className={styles.topBackBtn} onClick={handleGoBack}>
          ‹ Quay lại
        </button>
        <div className={styles.langSelector}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/2/21/Flag_of_Vietnam.svg"
            alt="Vietnam Flag"
            className={styles.flagIcon}
          />
          <span>Vi</span>
        </div>
      </div>

      <div className={styles.portalCard}>
        {/* Header branding & live ticking countdown */}
        <div className={styles.header}>
          <div className={styles.logoVnpay}>
            <img src="/vnpay_app.png" alt="VNPAY" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          </div>

          <div className={styles.timerWrapper}>
            <span>Giao dịch hết hạn sau</span>
            <div className={styles.timerBoxes}>
              <span className={styles.timerDigit}>{timerParts.minutes[0]}</span>
              <span className={styles.timerDigit}>{timerParts.minutes[1]}</span>
              <span>:</span>
              <span className={styles.timerDigit}>{timerParts.seconds[0]}</span>
              <span className={styles.timerDigit}>{timerParts.seconds[1]}</span>
            </div>
          </div>
        </div>

        {/* Content steps view */}
        <div className={styles.content}>
          {/* STEP 1: Method selection with official accordions */}
          {currentStep === 'method_select' && (
            <>
              <div className={styles.pageTitle}>Chọn phương thức thanh toán (Test)</div>

              <div className={styles.accordion}>
                {/* Method 1: QR scanning */}
                <div className={`${styles.accordionItem} ${activeAccordion === 'qr' ? styles.accordionItemActive : ''}`}>
                  <div className={styles.accordionHeader} onClick={() => setActiveAccordion(activeAccordion === 'qr' ? null : 'qr')}>
                    <span className={styles.accordionTitle}>
                      App Ngân hàng và Ví điện tử (<span className={styles.accordionTitleHighlight}>VNPAY-QR</span>)
                    </span>
                    <img src="/vnpay_qr.png" alt="VNPAY-QR" className={styles.methodIconImg} style={{ height: '38px' }} />
                  </div>
                  {activeAccordion === 'qr' && (
                    <div className={styles.accordionContent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div className={styles.qrBoxWrapper} style={{ border: 'none', padding: 0, margin: 0, boxShadow: 'none', background: 'transparent' }}>
                        <div className={styles.qrScanPlaceholder}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`}
                            alt="Mã QR"
                            style={{ width: '160px', height: '160px', objectFit: 'contain' }}
                          />
                          <div className={styles.qrLaserLine} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: '#475569', fontWeight: 700, marginBottom: '4px' }}>
                          Quét mã để nạp tiền qua App Ngân hàng / Ví Điện tử
                        </p>
                        <p style={{ fontSize: '12.5px', color: '#64748b' }}>
                          Sử dụng camera điện thoại hoặc tính năng quét mã QR trên ứng dụng ngân hàng của bạn.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
                        <button
                          type="button"
                          className={styles.btnActionSecondary}
                          style={{ padding: '10px 14px' }}
                          onClick={() => {
                            setSelectedMethod('qr');
                            setCurrentStep('checkout');
                          }}
                        >
                          Mở trang chi tiết
                        </button>
                        <button
                          type="button"
                          className={styles.btnActionPrimary}
                          style={{ padding: '10px 14px' }}
                          onClick={async () => {
                            setSelectedMethod('qr');
                            await requestOtpAndTransition();
                          }}
                        >
                          Xác nhận quét xong
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Method 2: Domestic ATM Card */}
                <div className={`${styles.accordionItem} ${activeAccordion === 'atm' ? styles.accordionItemActive : ''}`}>
                  <div className={styles.accordionHeader} onClick={() => setActiveAccordion(activeAccordion === 'atm' ? null : 'atm')}>
                    <span className={styles.accordionTitle}>Thẻ nội địa và tài khoản ngân hàng</span>
                    <img src="/bank_building.png" alt="Bank" className={styles.methodIconImg} style={{ height: '38px' }} />
                  </div>
                  {activeAccordion === 'atm' && (
                    <div className={styles.accordionContent}>
                      {/* Search bank catalog input box */}
                      <div className={styles.searchWrapper}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                          type="text"
                          className={styles.searchInput}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Tìm kiếm ngân hàng..."
                        />
                      </div>

                      {/* Filterable grid list of banks */}
                      <div className={styles.bankGrid}>
                        {filteredBanks.map((bank) => (
                          <div
                            key={bank.code}
                            className={styles.bankItem}
                            title={bank.name}
                            onClick={() => {
                              setSelectedBank(bank);
                              setSelectedMethod('atm');
                              setCurrentStep('checkout');
                            }}
                          >
                            <img
                              src={bank.logo || ''}
                              alt={bank.name}
                              className={styles.bankLogoImage}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const fallbackText = parent.querySelector('.' + styles.bankFallbackText);
                                  if (fallbackText) {
                                    (fallbackText as HTMLElement).style.display = 'block';
                                  }
                                }
                              }}
                            />
                            <span className={styles.bankFallbackText} style={{ display: 'none' }}>
                              {bank.code}
                            </span>
                          </div>
                        ))}
                        {filteredBanks.length === 0 && (
                          <div style={{ gridColumn: 'span 6', textAlign: 'center', padding: '16px 0', color: '#94a3b8' }}>
                            Không tìm thấy ngân hàng tương ứng.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Method 3: International Card */}
                <div className={`${styles.accordionItem} ${activeAccordion === 'intl' ? styles.accordionItemActive : ''}`}>
                  <div className={styles.accordionHeader} onClick={() => setActiveAccordion(activeAccordion === 'intl' ? null : 'intl')}>
                    <span className={styles.accordionTitle}>Thẻ thanh toán quốc tế</span>
                    <img src="/intl_cards.png" alt="International Cards" className={styles.methodIconImg} style={{ height: '28px' }} />
                  </div>
                  {activeAccordion === 'intl' && (
                    <div className={styles.accordionContent}>
                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', textAlign: 'center' }}>
                        Chọn thương hiệu thẻ quốc tế của bạn để thanh toán:
                      </p>
                      <div className={styles.bankGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)', maxHeight: 'none' }}>
                        <div
                          className={styles.bankItem}
                          style={{ height: '68px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                          onClick={() => {
                            setSelectedBank({ code: 'VISA', name: 'Thẻ Quốc tế VISA' });
                            setSelectedMethod('intl');
                            setCurrentStep('checkout');
                          }}
                        >
                          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#005baa', letterSpacing: '0.5px', fontFamily: "'Outfit', sans-serif" }}>VISA</span>
                        </div>
                        <div
                          className={styles.bankItem}
                          style={{ height: '68px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                          onClick={() => {
                            setSelectedBank({ code: 'MC', name: 'Thẻ Quốc tế MasterCard' });
                            setSelectedMethod('intl');
                            setCurrentStep('checkout');
                          }}
                        >
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ea580c', fontFamily: "'Outfit', sans-serif" }}>MasterCard</span>
                        </div>
                        <div
                          className={styles.bankItem}
                          style={{ height: '68px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                          onClick={() => {
                            setSelectedBank({ code: 'JCB', name: 'Thẻ Quốc tế JCB' });
                            setSelectedMethod('intl');
                            setCurrentStep('checkout');
                          }}
                        >
                          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0ea5e9', fontFamily: "'Outfit', sans-serif" }}>JCB</span>
                        </div>
                        <div
                          className={styles.bankItem}
                          style={{ height: '68px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                          onClick={() => {
                            setSelectedBank({ code: 'AMEX', name: 'Thẻ Quốc tế AMEX' });
                            setSelectedMethod('intl');
                            setCurrentStep('checkout');
                          }}
                        >
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#475569', fontFamily: "'Outfit', sans-serif" }}>AMEX</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Method 4: App VNPay */}
                <div className={`${styles.accordionItem} ${activeAccordion === 'vn_app' ? styles.accordionItemActive : ''}`}>
                  <div className={styles.accordionHeader} onClick={() => setActiveAccordion(activeAccordion === 'vn_app' ? null : 'vn_app')}>
                    <span className={styles.accordionTitle}>App VNPay</span>
                    <img src="/vnpay_app.png" alt="VNPAY App" className={styles.methodIconImg} style={{ height: '38px' }} />
                  </div>
                  {activeAccordion === 'vn_app' && (
                    <div className={styles.accordionContent} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div className={styles.qrBoxWrapper} style={{ border: 'none', padding: 0, margin: 0, boxShadow: 'none', background: 'transparent' }}>
                        <div className={styles.qrScanPlaceholder}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`}
                            alt="Mã QR"
                            style={{ width: '160px', height: '160px', objectFit: 'contain' }}
                          />
                          <div className={styles.qrLaserLine} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: '#475569', fontWeight: 700, marginBottom: '4px' }}>
                          Quét mã để nạp tiền qua Ví điện tử VNPAY
                        </p>
                        <p style={{ fontSize: '12.5px', color: '#64748b' }}>
                          Mở ứng dụng Ví điện tử VNPAY của bạn và quét mã để thanh toán tức thì.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
                        <button
                          type="button"
                          className={styles.btnActionSecondary}
                          style={{ padding: '10px 14px' }}
                          onClick={() => {
                            setSelectedMethod('vn_app');
                            setCurrentStep('checkout');
                          }}
                        >
                          Mở trang chi tiết
                        </button>
                        <button
                          type="button"
                          className={styles.btnActionPrimary}
                          style={{ padding: '10px 14px' }}
                          onClick={async () => {
                            setSelectedMethod('vn_app');
                            await requestOtpAndTransition();
                          }}
                        >
                          Xác nhận quét xong
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Checkout details split screen (QR left, Inputs right) */}
          {currentStep === 'checkout' && (
            <>
              {/* Alert Warning notice banner */}
              <div className={styles.alertBanner}>
                <span className={styles.alertIcon}>⚠️</span>
                <span className={styles.alertText}>
                  Quý khách vui lòng không tắt trình duyệt cho đến khi nhận được kết quả giao dịch trên website. Trường hợp đã thanh toán nhưng chưa nhận được kết quả giao dịch, vui lòng bấm <span className={styles.alertLink} onClick={() => void requestOtpAndTransition()}>"Tại đây"</span> để nhận kết quả. Xin cảm ơn!
                </span>
              </div>

              <div className={styles.splitLayout}>
                {/* Left side column: Invoice details card */}
                <div className={styles.leftCol}>
                  <div className={styles.orderTitle}>Thông tin đơn hàng (Test)</div>
                  
                  <div className={styles.orderRow}>
                    <span className={styles.orderLabel}>Số tiền thanh toán</span>
                    <strong className={styles.orderAmountValue}>{formatCurrency(amount)}</strong>
                  </div>
                  <div className={styles.orderRow}>
                    <span className={styles.orderLabel}>Giá trị đơn hàng</span>
                    <span className={styles.orderValue}>{formatCurrency(amount)}</span>
                  </div>
                  <div className={styles.orderRow}>
                    <span className={styles.orderLabel}>Phí giao dịch</span>
                    <span className={styles.orderValue}>0 VND</span>
                  </div>
                  <div className={styles.orderRow}>
                    <span className={styles.orderLabel}>Mã đơn hàng</span>
                    <span className={styles.orderValue} style={{ fontSize: '12px' }}>{txnRef}</span>
                  </div>
                  <div className={styles.orderRow}>
                    <span className={styles.orderLabel}>Nhà cung cấp</span>
                    <span className={styles.orderValue}>https://vnshop.vn/</span>
                  </div>
                </div>

                {/* Right side column: ATM Card inputs/forms */}
                <div className={styles.rightCol}>
                  {(selectedMethod === 'atm' || selectedMethod === 'intl') && (
                    <>
                      <div className={styles.rightHeader}>
                        {selectedMethod === 'atm' 
                          ? `Thanh toán qua Ngân hàng ${selectedBank?.code || 'NCB'}` 
                          : 'Thanh toán qua Thẻ Quốc tế'}
                      </div>
                      <div className={styles.rightSubHeader}>
                        {selectedMethod === 'atm' ? 'Thẻ nội địa' : 'Visa / MasterCard / JCB'}
                      </div>

                      {/* Visual credit cards presets panel */}
                      <div className={styles.presetsSectionTitle}>💡 Click chọn nhanh thẻ Test VNPay:</div>
                      <div className={styles.creditCardsGrid}>
                        {/* Success card green */}
                        <div
                          className={`${styles.creditCard} ${styles.cardSuccess} ${
                            cardNumber === '970419852613143212' ? styles.creditCardSelected : ''
                          }`}
                          onClick={() => applyPreset('success')}
                        >
                          <div className={styles.cardHeader}>
                            <span className={styles.cardBankName}>NCB TEST CARD</span>
                            <span className={styles.cardBadge}>THÀNH CÔNG</span>
                          </div>
                          <div className={styles.cardChip} />
                          <div className={styles.cardNumberText}>9704 1985 2613 1432 12</div>
                          <div className={styles.cardFooter}>
                            <div>
                              <div className={styles.cardFooterLabel}>CHỦ THẺ</div>
                              <div className={styles.cardFooterValue}>NGUYEN VAN A</div>
                            </div>
                            <div>
                              <div className={styles.cardFooterLabel}>HẠN DÙNG</div>
                              <div className={styles.cardFooterValue}>07/15</div>
                            </div>
                          </div>
                        </div>

                        {/* Failed card red */}
                        <div
                          className={`${styles.creditCard} ${styles.cardFail} ${
                            cardNumber === '970419133333333333' ? styles.creditCardSelected : ''
                          }`}
                          onClick={() => applyPreset('fail_balance')}
                        >
                          <div className={styles.cardHeader}>
                            <span className={styles.cardBankName}>NCB TEST CARD</span>
                            <span className={styles.cardBadge}>LỖI SỐ DƯ</span>
                          </div>
                          <div className={styles.cardChip} />
                          <div className={styles.cardNumberText}>9704 1913 3333 3333 33</div>
                          <div className={styles.cardFooter}>
                            <div>
                              <div className={styles.cardFooterLabel}>CHỦ THẺ</div>
                              <div className={styles.cardFooterValue}>NGUYEN VAN A</div>
                            </div>
                            <div>
                              <div className={styles.cardFooterLabel}>HẠN DÙNG</div>
                              <div className={styles.cardFooterValue}>07/15</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card forms */}
                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Số thẻ</label>
                        <div className={styles.inputContainer}>
                          <input
                            type="text"
                            maxLength={20}
                            className={styles.inputText}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="Nhập số thẻ"
                          />
                          {selectedBank && (
                            <span className={styles.bankNameIcon}>{selectedBank.code}</span>
                          )}
                        </div>
                        <span className={styles.validationHint}>Thử thẻ NCB thành công: 970419852613143212</span>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Tên chủ thẻ (không dấu)</label>
                        <input
                          type="text"
                          className={styles.inputText}
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NGUYEN VAN A"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.inputLabel}>Ngày phát hành</label>
                        <input
                          type="text"
                          maxLength={5}
                          className={styles.inputText}
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          placeholder="MM/YY"
                        />
                      </div>

                      {formError && <div className={styles.errorText}>{formError}</div>}

                      <a href="#" className={styles.infoLink} onClick={(e) => e.preventDefault()}>
                        📄 Điều khoản sử dụng dịch vụ
                      </a>

                      <div className={styles.buttonGroup}>
                        <button
                          type="button"
                          className={styles.btnActionSecondary}
                          onClick={() => setShowCancelModal(true)}
                          disabled={loading}
                        >
                          Hủy thanh toán
                        </button>
                        <button
                          type="button"
                          className={styles.btnActionPrimary}
                          onClick={handleNextStep}
                          disabled={loading}
                        >
                          Tiếp tục
                        </button>
                      </div>
                    </>
                  )}

                  {/* QR Scan / App Wallet Simulator view */}
                  {(selectedMethod === 'qr' || selectedMethod === 'vn_app') && (
                    <>
                      <div className={styles.rightHeader}>
                        {selectedMethod === 'qr' ? 'Quét mã qua App Ngân hàng/Ví' : 'Quét mã qua App ví VNPAY'}
                      </div>
                      <div className={styles.rightSubHeader}>
                        {selectedMethod === 'qr' ? 'VNPAY-QR' : 'VNPAY APP'}
                      </div>

                      <div className={styles.qrBoxWrapper} style={{ boxShadow: 'none', border: 'none', padding: '0 0 16px' }}>
                        <div className={styles.qrScanPlaceholder}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`}
                            alt="Mã QR"
                            style={{ width: '160px', height: '160px', objectFit: 'contain' }}
                          />
                          <div className={styles.qrLaserLine} />
                        </div>
                        <span className={styles.qrScanText}>Quét mã để nạp</span>
                      </div>

                      <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '24px', textAlign: 'center' }}>
                        Sử dụng chức năng quét QR trên điện thoại. Bấm nút dưới để giả lập hoàn tất quét mã.
                      </p>

                      <div className={styles.buttonGroup}>
                        <button
                          type="button"
                          className={styles.btnActionSecondary}
                          onClick={() => setShowCancelModal(true)}
                          disabled={loading}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className={styles.btnActionPrimary}
                          onClick={() => void requestOtpAndTransition()}
                          disabled={loading}
                        >
                          Xác nhận quét xong
                        </button>
                      </div>
                    </>
                  )}

                  {/* Unsupported method placeholders */}
                  {selectedMethod !== 'atm' && selectedMethod !== 'qr' && selectedMethod !== 'intl' && selectedMethod !== 'vn_app' && (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                      <span style={{ fontSize: '32px', display: 'block', marginBottom: '16px' }}>🛠️</span>
                      <strong style={{ color: '#ef4444', display: 'block', marginBottom: '8px' }}>
                        Phương thức đang bảo trì
                      </strong>
                      <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
                        Vui lòng quay lại và chọn phương thức khác hoạt động để thực hiện giao dịch thử nghiệm.
                      </p>
                      <button
                        type="button"
                        className={styles.btnActionSecondary}
                        style={{ marginTop: '24px', width: '100%' }}
                        onClick={() => setCurrentStep('method_select')}
                      >
                        Chọn phương thức khác
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 3: OTP Verification step styled in form layout */}
          {currentStep === 'otp_verify' && (
            <>
              <div className={styles.pageTitle}>Xác thực mã OTP</div>

              <div style={{ maxWidth: '460px', width: '100%', margin: '0 auto' }}>
                <div className={styles.otpArea}>
                  <div className={styles.otpInstructionText}>
                    {emailSent ? (
                      <span>Mã OTP đã được gửi qua email đến địa chỉ kết thúc bằng <strong>{maskedEmail}</strong>. Vui lòng kiểm tra hộp thư để hoàn tất giao dịch.</span>
                    ) : (
                      <span>Mã OTP đã được tạo cho email tài khoản của quý khách (kết thúc bằng <strong>{maskedEmail}</strong>). Vui lòng nhập mã để hoàn tất giao dịch.</span>
                    )}
                  </div>

                  {emailSent ? (
                    <div className={styles.otpInstructionHighlight}>
                      📩 Vui lòng kiểm tra email của bạn để nhận mã OTP thực (bao gồm cả thư rác).
                    </div>
                  ) : (
                    <div className={styles.otpInstructionHighlight} style={{ backgroundColor: '#fffbeb', borderColor: '#fde047', color: '#a16207' }}>
                      ⚠️ Không gửi được email OTP. Hệ thống sẽ sử dụng mã thử nghiệm.
                    </div>
                  )}

                  <div className={styles.otpInstructionHighlight} style={{ cursor: 'pointer', background: '#e0f2fe', borderColor: '#7dd3fc', color: '#0369a1', marginTop: '8px' }} onClick={() => setOtpCode('123456')}>
                    💡 Thử nghiệm Sandbox: Nhấp để tự động điền mã OTP thử nghiệm: <strong>123456</strong>
                  </div>

                  <div className={styles.otpFieldWrapper}>
                    <input
                      type="text"
                      maxLength={6}
                      className={styles.otpInput}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''));
                        setOtpError('');
                      }}
                      placeholder="••••••"
                    />
                  </div>

                  {otpError && <div className={styles.errorText} style={{ textAlign: 'center' }}>{otpError}</div>}

                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      className={styles.btnActionSecondary}
                      onClick={() => setShowCancelModal(true)}
                      disabled={loading}
                    >
                      Hủy giao dịch
                    </button>
                    <button
                      type="button"
                      className={styles.btnActionPrimary}
                      onClick={handleConfirmOtp}
                      disabled={loading}
                    >
                      {loading && <div className={styles.loadingSpinner} />}
                      Xác nhận
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer badges & contacts */}
        <div className={styles.footer}>
          <div className={styles.footerEmail}>
            📬 <a href="mailto:hotrovnpay@vnpay.vn" className={styles.emailLink}>
              hotrovnpay@vnpay.vn
            </a>
          </div>

          <div className={styles.footerBadges}>
            <span className={styles.badgeSecure}>✓ SECURE GLOBALSIGN</span>
            <span className={styles.badgePci}>PCI DSS COMPLIANT</span>
          </div>
        </div>
      </div>

      <div className={styles.bottomCopyrightText}>Phát triển bởi VNPAY © 2026</div>

      {/* Cancel Confirmation Popup Modal Overlay */}
      {showCancelModal && (
        <div className={styles.cancelOverlay}>
          <div className={styles.cancelModal}>
            <div className={styles.cancelHeader}>Hủy thanh toán</div>
            <div className={styles.cancelBody}>
              Quý khách có chắc chắn muốn hủy thanh toán giao dịch này?
            </div>
            <div className={styles.cancelFooter}>
              <button
                type="button"
                className={styles.btnCancelDismiss}
                onClick={() => setShowCancelModal(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className={styles.btnCancelConfirm}
                onClick={() => {
                  setShowCancelModal(false);
                  void executeCallback('fail');
                }}
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
