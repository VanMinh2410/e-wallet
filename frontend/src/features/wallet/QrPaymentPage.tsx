import { useRef, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api, { unwrap } from '../../shared/services/api';
import { useToast } from '../../shared/context/ToastContext';
import { getApiErrorMessage } from '../../shared/utils/apiError';
import { AppHeader } from '../../shared/components/Layout/AppHeader';
import { Button } from '../../shared/components/ui/Button';
import { QrScanner } from '../../shared/components/QrScanner';
import { OtpModal } from '../../shared/components/OtpModal';
import { formatCurrency } from '../../shared/utils/format';
import { useAppSelector } from '../../app/hooks';
import styles from './QrPaymentPage.module.css';

interface LinkedBankAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  isVerified: boolean;
}

export function QrPaymentPage() {
  const authUser = useAppSelector((s) => s.auth.user);
  if (authUser?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [tab, setTab] = useState<'receive' | 'pay'>('receive');
  
  // States for Pay QR
  const [qrData, setQrData] = useState('');
  const [qrDataRaw, setQrDataRaw] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidRef, setPaidRef] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [qrAmountVal, setQrAmountVal] = useState<number | null>(null);

  // States for Receive/Generate QR
  const [generatedQr, setGeneratedQr] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [modalAmountInput, setModalAmountInput] = useState('');

  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => unwrap<{ id: string; balance: number }>(await api.get('/wallets')),
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ['user-bank-accounts'],
    queryFn: async () => unwrap<LinkedBankAccount[]>(await api.get('/bank-accounts')),
  });

  // Automatically generate standard QR on load
  useEffect(() => {
    void generateQr();
  }, []);

  const generateQr = async (amt?: string) => {
    try {
      const res = await api.get('/qr/generate', { params: amt ? { amount: amt } : {} });
      const data = unwrap<{ qrData: string }>(res);
      setGeneratedQr(data.qrData);
      setRecipientName(authUser?.fullName || 'Nguyễn Văn An');
    } catch {
      // Fallback local mockup QR content if API fails
      const localData = btoa(JSON.stringify({
        payload: JSON.stringify({
          merchantEmail: authUser?.email || 'usera@hki-wallet.dev',
          amount: amt ? Number(amt) : undefined
        })
      }));
      setGeneratedQr(`http://localhost:5173/qr-payment?data=${localData}`);
      setRecipientName(authUser?.fullName || 'Nguyễn Văn An');
    }
  };

  const handleSetAmountConfirm = () => {
    setCustomAmount(modalAmountInput);
    void generateQr(modalAmountInput);
    setShowAmountModal(false);
    toast('Đã thiết lập số tiền nhận QR', 'success');
  };

  const handleClearAmount = () => {
    setCustomAmount('');
    setModalAmountInput('');
    void generateQr();
    setShowAmountModal(false);
    toast('Đã xóa số tiền nhận QR', 'info');
  };

  const extractBase64 = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    
    if (trimmed.includes('?data=')) {
      const parts = trimmed.split('?data=');
      if (parts[1]) {
        return parts[1].split('&')[0];
      }
    } else if (trimmed.includes('&data=')) {
      const parts = trimmed.split('&data=');
      if (parts[1]) {
        return parts[1].split('&')[0];
      }
    }
    return trimmed;
  };

  const decodeQrPayload = (extracted: string) => {
    try {
      const decoded = JSON.parse(atob(extracted));
      const inner = JSON.parse(decoded.payload);
      if (inner.merchantEmail) {
        setRecipientEmail(inner.merchantEmail);
      } else {
        setRecipientEmail('');
      }
      if (inner.amount) {
        setQrAmountVal(Number(inner.amount));
        setPayAmount(String(inner.amount));
      } else {
        setQrAmountVal(null);
        setPayAmount('');
      }
    } catch {
      setRecipientEmail('');
      setQrAmountVal(null);
    }
  };

  const handleQrCodeChange = (rawInput: string) => {
    const extracted = extractBase64(rawInput);
    setQrDataRaw(rawInput);
    setQrData(extracted);
    decodeQrPayload(extracted);
  };

  const getQrAmount = (rawQr: string): number => {
    try {
      const decoded = JSON.parse(atob(rawQr));
      const inner = JSON.parse(decoded.payload);
      return Number(inner.amount) || 0;
    } catch {
      return 0;
    }
  };

  const pay = async (otpCode?: string) => {
    if (!wallet?.id || !qrData.trim()) {
      toast('Vui lòng quét hoặc dán mã QR', 'error');
      return;
    }

    const qrAmount = getQrAmount(qrData.trim());
    const finalAmount = Number(payAmount) || qrAmount;

    if (finalAmount >= 500_000 && !otpCode) {
      setOtpOpen(true);
      return;
    }

    setPaying(true);
    try {
      const res = await api.post('/transactions/qr-payment', {
        walletId: wallet.id,
        qrData: qrData.trim(),
        amount: payAmount ? Number(payAmount) : undefined,
        otpCode,
      });
      const data = unwrap<{ newBalance: number; reference: string; amount: number }>(res);
      setPaidAmount(data.amount);
      setPaidRef(data.reference);
      setPaySuccess(true);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      toast(`Thanh toán thành công! Số dư: ${formatCurrency(data.newBalance)}`, 'success');
    } catch (err: unknown) {
      toast(getApiErrorMessage(err, 'QR không hợp lệ'), 'error');
    } finally {
      setPaying(false);
    }
  };

  const downloadQr = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg || !generatedQr) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vbank-qr.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast('Đã tải hình ảnh QR xuống máy', 'success');
  };

  const shareQrText = async () => {
    if (!generatedQr) return;
    if (navigator.share) {
      await navigator.share({ title: 'QR thanh toán VBANK', text: generatedQr });
    } else {
      await navigator.clipboard.writeText(generatedQr);
      toast('Đã sao chép liên kết thanh toán QR', 'success');
    }
  };

  const printQr = () => {
    window.print();
  };

  const linkedBankText = bankAccounts?.[0] 
    ? `${bankAccounts[0].bankName} - ${bankAccounts[0].accountNumber}` 
    : 'Vietcombank - 0123456789';

  return (
    <div className={styles.container}>
      <AppHeader variant="sub" title="QR Thanh toán" showBack={true} backTo="/dashboard" />

      <div className={styles.paddingWrapper}>
        {/* Navigation Switcher Capsule */}
        <div className={styles.tabsContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === 'receive' ? styles.tabActive : ''}`}
            onClick={() => {
              setTab('receive');
              setPaySuccess(false);
            }}
          >
            Mã QR của tôi
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === 'pay' ? styles.tabActive : ''}`}
            onClick={() => {
              setTab('pay');
              setPaySuccess(false);
            }}
          >
            Quét QR
          </button>
        </div>

        {/* TAB 1: Mã QR của tôi (Receive Tab) */}
        {tab === 'receive' && (
          <div className={styles.desktopGrid}>
            <div className={styles.profileArea}>
              <div className={styles.profileHeader}>
                <h3 className={styles.profileName}>{recipientName}</h3>
                <p className={styles.profileBank}>{linkedBankText}</p>
                <button type="button" className={styles.receiveBadge}>Nhận tiền</button>
              </div>
            </div>

            <div className={styles.qrCardArea}>
              <div className={styles.qrCardWrapper}>
                <div className={styles.qrCard} ref={qrRef}>
                  <div className={styles.qrFrame}>
                    {generatedQr ? (
                      <QRCodeSVG
                        value={generatedQr}
                        size={210}
                        level="Q"
                        includeMargin={false}
                        fgColor="#0C447C"
                      />
                    ) : (
                      <div style={{ width: 210, height: 210, background: '#f1f5f9' }} />
                    )}
                    {/* Absolute overlay logo "V" exactly like the image */}
                    <div className={styles.qrLogoOverlay}>V</div>
                  </div>
                </div>
              </div>

              {/* Custom static amount layout if set */}
              {customAmount && (
                <p style={{ textAlign: 'center', margin: '-4px 0 4px', fontSize: 16, fontWeight: 800, color: '#0C447C' }}>
                  Số tiền yêu cầu: {formatCurrency(Number(customAmount))}
                </p>
              )}
            </div>

            <div className={styles.actionsArea}>
              {/* Utility Grid Buttons (2x2) */}
              <div className={styles.actionsGrid}>
                <div className={styles.gridItem} onClick={downloadQr} role="button" tabIndex={0}>
                  <div className={styles.gridIconBox}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                  <span className={styles.gridLabel}>Lưu ảnh</span>
                </div>

                <div className={styles.gridItem} onClick={shareQrText} role="button" tabIndex={0}>
                  <div className={styles.gridIconBox}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </div>
                  <span className={styles.gridLabel}>Chia sẻ</span>
                </div>

                <div className={styles.gridItem} onClick={() => { setModalAmountInput(customAmount); setShowAmountModal(true); }} role="button" tabIndex={0}>
                  <div className={styles.gridIconBox}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="12" y2="12" />
                      <path d="M12 12h3" />
                    </svg>
                  </div>
                  <span className={styles.gridLabel}>{customAmount ? 'Đổi số tiền' : 'Đặt số tiền'}</span>
                </div>

                <div className={styles.gridItem} onClick={printQr} role="button" tabIndex={0}>
                  <div className={styles.gridIconBox}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                  </div>
                  <span className={styles.gridLabel}>In QR</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Quét QR (Pay Tab) */}
        {tab === 'pay' && !paySuccess && (
          <div className={styles.desktopGridPay}>
            <div className={styles.formColumn}>
              {/* Glowing Corner Brackets Simulator Frame */}
              <div className={styles.scanArea}>
                <QrScanner
                  onScan={(text) => {
                    handleQrCodeChange(text);
                    toast('Đã nhận diện mã QR thành công', 'success');
                  }}
                  onError={(msg) => console.log('Scanner error:', msg)}
                />
                <div className={styles.scanOverlay}>
                  <div className={styles.scanFrame}>
                    <span className={`${styles.scanCorner} ${styles.scanCornerTopLeft}`} />
                    <span className={`${styles.scanCorner} ${styles.scanCornerTopRight}`} />
                    <span className={`${styles.scanCorner} ${styles.scanCornerBottomLeft}`} />
                    <span className={`${styles.scanCorner} ${styles.scanCornerBottomRight}`} />
                    <div className={styles.scanBeam} />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sidebarColumn}>
              <p className={styles.balanceText}>
                Số dư khả dụng: <strong>{formatCurrency(wallet?.balance ?? 24580000)} đ</strong>
              </p>

              {/* Paste Data Input */}
              <div className={styles.inputGroup}>
                <label>Nhập mã QR hoặc Link thanh toán</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={qrDataRaw}
                  onChange={(e) => handleQrCodeChange(e.target.value)}
                  placeholder="Dán mã QR hoặc link có ?data=..."
                />
              </div>

              {/* Transaction Preview Info Card */}
              {recipientEmail && (
                <div className={styles.previewCard}>
                  <div className={styles.previewHeader}>Thông tin giao dịch</div>
                  <div className={styles.previewRow}>
                    <span className={styles.previewRowLabel}>Người nhận</span>
                    <span className={styles.previewRowValue}>{recipientEmail}</span>
                  </div>
                  {qrAmountVal !== null && (
                    <div className={styles.previewRow}>
                      <span className={styles.previewRowLabel}>Số tiền</span>
                      <span className={`${styles.previewRowValue} ${styles.previewAmount}`}>
                        {formatCurrency(qrAmountVal)} đ
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Editable Amount Input if not set in QR */}
              {qrAmountVal === null && qrData.trim() !== '' && (
                <div className={styles.inputGroup}>
                  <label>Nhập số tiền chuyển khoản (VND)</label>
                  <input
                    type="number"
                    className={styles.textInput}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Nhập số tiền giao dịch..."
                  />
                </div>
              )}

              <Button
                onClick={() => void pay()}
                disabled={paying || !qrData.trim()}
                style={{ background: '#0C447C', height: 48, borderRadius: 12, fontWeight: 700 }}
              >
                {paying ? '⏳ Đang xử lý...' : '💳 Thanh toán ngay'}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2 Success Flow: Premium receipt sheet */}
        {tab === 'pay' && paySuccess && (
          <div className={styles.successWrapper}>
            <div className={styles.successIconCircle}>✓</div>
            <h2 className={styles.successTitle}>Giao dịch thành công!</h2>
            <div className={styles.successAmount}>-{formatCurrency(paidAmount)} đ</div>

            <div className={styles.receiptCard}>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Dịch vụ</span>
                <span className={styles.receiptValue}>Thanh toán QR Code</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Người nhận</span>
                <span className={styles.receiptValue}>{recipientEmail || 'Hệ thống đối tác'}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Mã tham chiếu</span>
                <span className={styles.receiptValue} style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {paidRef}
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Thời gian</span>
                <span className={styles.receiptValue}>{new Date().toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setPaySuccess(false);
                setQrData('');
                setQrDataRaw('');
                setPayAmount('');
              }}
              style={{ width: '100%' }}
            >
              Quét mã mới
            </Button>
          </div>
        )}
      </div>

      {/* Amount Settings Modal Overlay */}
      {showAmountModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Nhập số tiền nhận</h3>
            <div className={styles.inputGroup}>
              <label>Số tiền (VND)</label>
              <input
                type="number"
                className={styles.textInput}
                value={modalAmountInput}
                onChange={(e) => setModalAmountInput(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <Button
                variant="ghost"
                onClick={handleClearAmount}
                style={{ flex: 1, color: '#EF4444' }}
              >
                Xóa số tiền
              </Button>
              <Button
                onClick={handleSetAmountConfirm}
                style={{ flex: 1, background: '#0C447C' }}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OtpModal Verification for transactions >= 500k */}
      <OtpModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        userEmail={authUser?.email}
        transactionOtp={true}
        onVerified={async () => {
          setOtpOpen(false);
          await pay();
        }}
      />
    </div>
  );
}

