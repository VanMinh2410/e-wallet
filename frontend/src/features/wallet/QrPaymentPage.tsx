import { useRef, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, Link } from 'react-router-dom';
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
  accountNumberMasked: string;
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
  const [recipientNameResolved, setRecipientNameResolved] = useState('');
  const [description, setDescription] = useState('');
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

  const { data: bankAccounts, isLoading: isBankAccountsLoading } = useQuery({
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
      setGeneratedQr(`${window.location.origin}/qr-payment?data=${localData}`);
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

  const [validationError, setValidationError] = useState('');

  const extractBase64 = (input: string): string => {
    let trimmed = input.trim();
    if (!trimmed) return '';

    try {
      trimmed = decodeURIComponent(trimmed);
    } catch {
      // Ignore URL component decoding error, fallback to raw input
    }

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

  const safeAtob = (str: string): string => {
    // Convert URL-safe base64 to standard base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add missing padding
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  };

  const resolveRecipientName = async (email: string) => {
    if (!email) {
      setRecipientNameResolved('');
      return;
    }
    try {
      const res = await api.post('/wallets/resolve-recipient', { recipient: email });
      const data = unwrap<{ fullName: string; email: string }>(res);
      setRecipientNameResolved(data?.fullName || '');
    } catch {
      setRecipientNameResolved('');
    }
  };

  const decodeQrPayload = (extracted: string) => {
    if (!extracted) {
      setRecipientEmail('');
      setRecipientNameResolved('');
      setQrAmountVal(null);
      setValidationError('');
      return;
    }

    try {
      const decoded = JSON.parse(safeAtob(extracted));
      if (!decoded.payload) {
        throw new Error('Payload missing');
      }
      const inner = JSON.parse(decoded.payload);
      const email = inner.merchantEmail || inner.email;

      if (email) {
        setRecipientEmail(email);
        void resolveRecipientName(email);
        setValidationError('');
      } else {
        setRecipientEmail('');
        setRecipientNameResolved('');
        setValidationError('Mã QR không chứa thông tin tài khoản nhận.');
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
      setRecipientNameResolved('');
      setQrAmountVal(null);
      setValidationError('Mã QR không hợp lệ hoặc sai định dạng. Vui lòng quét mã QR thanh toán của ví VBANK.');
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
      const decoded = JSON.parse(safeAtob(rawQr));
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

    if (!finalAmount || isNaN(finalAmount) || finalAmount < 1000) {
      toast('Số tiền giao dịch không hợp lệ (tối thiểu 1.000 đ)', 'error');
      return;
    }

    if (!otpCode) {
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
        description: description.trim() || undefined,
      });
      const data = unwrap<{ newBalance: number; reference: string; amount: number }>(res);
      setPaidAmount(data.amount || finalAmount);
      setPaidRef(data.reference);
      setPaySuccess(true);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions-all'] });
      toast(`Thanh toán thành công! Số dư: ${formatCurrency(data.newBalance)}`, 'success');
    } catch (err: unknown) {
      toast(getApiErrorMessage(err, 'QR không hợp lệ'), 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleCopyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(successMessage, 'success');
    } catch {
      toast('Không thể sao chép văn bản', 'error');
    }
  };

  const downloadQr = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg || !generatedQr) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width * 2; // scale for high quality
        canvas.height = img.height * 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'vbank-qr.png';
        a.click();
        toast('Đã tải hình ảnh QR xuống máy', 'success');
      };
      img.onerror = () => {
        fallbackSvgDownload(svgData);
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      const svgData = new XMLSerializer().serializeToString(svg);
      fallbackSvgDownload(svgData);
    }
  };

  const fallbackSvgDownload = (svgData: string) => {
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vbank-qr.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast('Đã tải hình ảnh QR (SVG) xuống máy', 'success');
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

  // Blocker warning if no bank account is linked
  const hasNoBank = !isBankAccountsLoading && bankAccounts && bankAccounts.length === 0;
  if (hasNoBank) {
    return (
      <div className={styles.container}>
        <AppHeader variant="sub" title="QR Thanh toán" showBack={true} backTo="/dashboard" />
        <div className={styles.paddingWrapper}>
          <div className={styles.warningBlocker}>
            <div className={styles.warningIcon}>⚠️</div>
            <h3 className={styles.warningTitle}>Yêu cầu liên kết ngân hàng</h3>
            <p className={styles.warningText}>
              Bạn cần liên kết ít nhất một tài khoản ngân hàng trước khi thực hiện thanh toán hoặc tạo mã QR nhận tiền.
            </p>
            <Link to="/profile" className={styles.warningAction}>
              Liên kết ngân hàng ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const linkedBankText = bankAccounts?.[0]
    ? `${bankAccounts[0].bankName} - ${bankAccounts[0].accountNumberMasked}`
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Mã QR của tôi
            </span>
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === 'pay' ? styles.tabActive : ''}`}
            onClick={() => {
              setTab('pay');
              setPaySuccess(false);
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </svg>
              Quét mã QR
            </span>
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
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2 2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                  </div>
                  <span className={styles.gridLabel}>In QR</span>
                </div>
              </div>

              {/* QR Code and Payment Link Copy Area */}
              {generatedQr && (
                <div className={styles.qrInfoCard}>
                  <div className={styles.qrInfoField}>
                    <label className={styles.qrInfoLabel}>ĐƯỜNG DẪN THANH TOÁN (LINK QR)</label>
                    <div className={styles.copyWrapper}>
                      <input
                        type="text"
                        readOnly
                        value={generatedQr.startsWith('http') ? generatedQr : `${window.location.origin}/qr-payment?data=${generatedQr}`}
                        className={styles.copyInput}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyText(generatedQr.startsWith('http') ? generatedQr : `${window.location.origin}/qr-payment?data=${generatedQr}`, 'Đã sao chép đường dẫn thanh toán')}
                        className={styles.copyButton}
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>

                  <div className={styles.qrInfoField} style={{ marginTop: 14 }}>
                    <label className={styles.qrInfoLabel}>MÃ QR (BASE64 TEXT)</label>
                    <div className={styles.copyWrapper}>
                      <input
                        type="text"
                        readOnly
                        value={generatedQr}
                        className={styles.copyInput}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyText(generatedQr, 'Đã sao chép mã QR')}
                        className={styles.copyButton}
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Quét QR (Pay Tab) */}
        {tab === 'pay' && !paySuccess && (
          <div className={styles.desktopGridPay}>
            <div className={styles.formColumn}>
              <QrScanner
                onScan={(text) => {
                  handleQrCodeChange(text);
                  toast('Đã nhận diện mã QR thành công', 'success');
                }}
                onError={(msg) => console.log('Scanner error:', msg)}
              />
            </div>

            <div className={styles.sidebarColumn}>
              {/* SỐ DƯ KHẢ DỤNG Pill */}
              <div className={styles.balancePill}>
                <span className={styles.balanceLabel}>SỐ DƯ KHẢ DỤNG</span>
                <span className={styles.balanceValue}>{formatCurrency(wallet?.balance ?? 0)} đ</span>
              </div>

              {/* Paste Data Input */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>NHẬP MÃ QR HOẶC LINK THANH TOÁN</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={qrDataRaw}
                  onChange={(e) => handleQrCodeChange(e.target.value)}
                  placeholder="Dán mã QR hoặc link có ?data=..."
                />
                {validationError && (
                  <p className={styles.errorText}>
                    {validationError}
                  </p>
                )}
              </div>

              {/* Transaction Preview Info Card */}
              {recipientEmail && (
                <div className={styles.previewCard}>
                  <div className={styles.previewHeader}>Thông tin giao dịch</div>
                  <div className={styles.previewRow}>
                    <span className={styles.previewRowLabel}>Người nhận</span>
                    <span className={styles.previewRowValue}>
                      {recipientNameResolved ? `${recipientNameResolved} (${recipientEmail})` : recipientEmail}
                    </span>
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
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>SỐ TIỀN (TÙY CHỌN)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                  />
                </div>
              )}

              {/* Editable Description input if recipient is set */}
              {recipientEmail && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>LỜI NHẮN CHUYỂN TIỀN (TÙY CHỌN)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nhập nội dung thanh toán..."
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
                <span className={styles.receiptValue}>
                  {recipientNameResolved ? `${recipientNameResolved} (${recipientEmail})` : recipientEmail || 'Hệ thống đối tác'}
                </span>
              </div>
              {description && (
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Lời nhắn</span>
                  <span className={styles.receiptValue}>{description}</span>
                </div>
              )}
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
                setDescription('');
                setRecipientNameResolved('');
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

