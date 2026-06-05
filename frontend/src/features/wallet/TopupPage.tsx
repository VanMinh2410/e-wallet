import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api, { unwrap } from '../../shared/services/api';
import { useToast } from '../../shared/context/ToastContext';
import { SubPageShell } from '../../shared/components/Layout/SubPageShell';
import { StepBar } from '../../shared/components/ui/StepBar';
import { Button } from '../../shared/components/ui/Button';
import { IconCopy } from '../../shared/components/ui/Icons';
import { formatCurrency } from '../../shared/utils/format';
import { useAppSelector } from '../../app/hooks';
import styles from './FlowPages.module.css';

const MOCK_BANK = {
  bankName: 'Vietcombank',
  fullBankName: 'Ngân hàng TMCP Ngoại thương Việt Nam',
  accountNumber: '1023456789',
  accountName: 'CONG TY HKi WALLET',
};

const QUICK_TOPUP = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
const PAYMENT_TIMEOUT = 15 * 60; // 15 phút

export function TopupPage() {
  const user = useAppSelector((s) => s.auth.user);
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'vietcombank' | 'vnpay' | 'vnpay_local'>('vietcombank');
  const [deposit, setDeposit] = useState<{ paymentCode: string; reference: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 1) {
      setCountdown(PAYMENT_TIMEOUT);
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timerRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const copy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast(`Đã sao chép ${label}`, 'success');
  };

  const createDeposit = async () => {
    const num = Number(amount);
    if (!num || num < 10000) { toast('Số tiền tối thiểu 10.000đ', 'error'); return; }
    if (num > 50_000_000) { toast('Số tiền tối đa 50.000.000đ', 'error'); return; }
    setLoading(true);
    try {
      const res = await api.post('/transactions/deposit', { amount: num, paymentMethod });
      const data = unwrap<{ paymentCode: string; reference: string; paymentUrl?: string }>(res);
      if ((paymentMethod === 'vnpay' || paymentMethod === 'vnpay_local') && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setDeposit({ paymentCode: data.paymentCode, reference: data.reference });
      setStep(1);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast(ax.response?.data?.message || 'Tạo yêu cầu thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmTransferred = async () => {
    if (!deposit) return;
    setLoading(true);
    try {
      const secret = 'change-me-webhook-secret';
      const msg = `${deposit.reference}:${amount}`;
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
      const sig = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      await api.post('/transactions/webhooks/payment', {
        reference: deposit.reference,
        amount: Number(amount),
      }, { headers: { 'x-webhook-signature': sig } });
      setStep(2);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      toast('Nạp tiền thành công!', 'success');
    } catch {
      toast('Chưa nhận được xác nhận. Thử lại sau.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const footer =
    step === 0 ? (
      <Button onClick={() => void createDeposit()} disabled={loading || Number(amount) < 10000}>
        {loading ? 'Đang xử lý...' : 'Tạo lệnh nạp tiền'}
      </Button>
    ) : step === 1 ? (
      <Button onClick={() => void confirmTransferred()} disabled={loading || countdown === 0}>
        {loading ? 'Đang kiểm tra...' : '✅ Tôi đã chuyển khoản'}
      </Button>
    ) : (
      <Button onClick={() => navigate('/dashboard')}>Hoàn tất</Button>
    );

  return (
    <SubPageShell title="Nạp tiền" footer={footer}>
      <StepBar steps={['Số tiền', 'Chuyển khoản', 'Kết quả']} current={step} />

      {/* STEP 0 — Nhập số tiền */}
      {step === 0 && (
        <div className={styles.desktopGrid}>
          <div className={styles.formColumn}>
            <div className={styles.topupInfoCard}>
              <h4>Hướng dẫn nạp tiền</h4>
              <ul>
                <li>Nhập số tiền bạn muốn nạp vào ví (tối thiểu 10.000đ).</li>
                <li>Hệ thống sẽ tạo mã QR chuyển khoản ngân hàng tương ứng.</li>
                <li>Chuyển khoản chính xác số tiền và nội dung hiển thị để ví tự động ghi nhận số dư.</li>
              </ul>
            </div>
          </div>
          <div className={styles.sidebarColumn}>
            <div className={styles.form}>
              <div className={styles.amountSection}>
                <label className={styles.amountLabel}>Số tiền nạp (VND)</label>
                <div className={styles.amountInputWrapper}>
                  <span className={styles.amountCurrency}>₫</span>
                  <input
                    className={styles.amountInput}
                    type="number"
                    min={10000}
                    max={50_000_000}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    id="topup-amount"
                  />
                </div>
                <div className={styles.quickAmounts}>
                  {QUICK_TOPUP.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={styles.chip}
                      onClick={() => setAmount(String(a))}
                    >
                      {a >= 1_000_000 ? `${a / 1_000_000}M` : `${a / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label className={styles.amountLabel}>Phương thức thanh toán</label>
                <div
                  className={`${styles.bankAccountCard} ${paymentMethod === 'vietcombank' ? styles.bankAccountCardActive : ''}`}
                  onClick={() => setPaymentMethod('vietcombank')}
                  style={{ marginBottom: 0 }}
                >
                  <div className={styles.bankAccountIcon} style={{ background: 'linear-gradient(135deg, #0C447C 0%, #1A5999 100%)' }}>🏦</div>
                  <div className={styles.bankAccountInfo}>
                    <div className={styles.bankAccountName}>Vietcombank QR</div>
                    <div className={styles.bankAccountNum}>Chuyển khoản hoặc quét mã QR ngân hàng</div>
                  </div>
                </div>

                <div
                  className={`${styles.bankAccountCard} ${paymentMethod === 'vnpay' ? styles.bankAccountCardActive : ''}`}
                  onClick={() => setPaymentMethod('vnpay')}
                  style={{ marginBottom: 0 }}
                >
                  <div className={styles.bankAccountIcon} style={{ background: 'linear-gradient(135deg, #005baa 0%, #007ee5 100%)' }}>🌐</div>
                  <div className={styles.bankAccountInfo}>
                    <div className={styles.bankAccountName}>VNPay Sandbox Thật</div>
                    <div className={styles.bankAccountNum}>Thử nghiệm qua trang cổng thanh toán Sandbox của VNPay</div>
                  </div>
                </div>

                <div
                  className={`${styles.bankAccountCard} ${paymentMethod === 'vnpay_local' ? styles.bankAccountCardActive : ''}`}
                  onClick={() => setPaymentMethod('vnpay_local')}
                  style={{ marginBottom: 0 }}
                >
                  <div className={styles.bankAccountIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>💻</div>
                  <div className={styles.bankAccountInfo}>
                    <div className={styles.bankAccountName}>VNPay Sandbox Giả lập (Local)</div>
                    <div className={styles.bankAccountNum}>Giao diện giả lập cục bộ 1-Click bảo mật và nhanh chóng</div>
                  </div>
                </div>
              </div>

              <p className={styles.hint}>
                Tối thiểu <strong>10.000đ</strong> · Tối đa <strong>50.000.000đ</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1 — Bank info */}
      {step === 1 && deposit && (
        <div className={styles.desktopGrid}>
          <div className={styles.formColumn}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className={`${styles.statusBadge} ${styles.pending}`}>⏳ Chờ thanh toán</span>
              {countdown > 0 ? (
                <span className={styles.countdownBadge}>⏱ {formatTime(countdown)}</span>
              ) : (
                <span className={styles.countdownBadge} style={{ color: 'var(--color-danger)' }}>⛔ Hết hạn</span>
              )}
            </div>

            <div className={styles.bankCard}>
              <div className={styles.bankCardHeader}>
                <div className={styles.bankCardIcon}>🏦</div>
                <div>
                  <div className={styles.bankCardTitle}>{MOCK_BANK.bankName}</div>
                  <div className={styles.bankCardSub}>{MOCK_BANK.fullBankName}</div>
                </div>
              </div>

              <div className={styles.bankRow}>
                <span>Số tài khoản</span>
                <button type="button" className={styles.copyBtn} onClick={() => copy(MOCK_BANK.accountNumber, 'STK')}>
                  {MOCK_BANK.accountNumber} <IconCopy />
                </button>
              </div>
              <div className={styles.bankRow}>
                <span>Chủ tài khoản</span>
                <strong>{MOCK_BANK.accountName}</strong>
              </div>
              <div className={styles.bankRow}>
                <span>Số tiền</span>
                <strong style={{ color: 'var(--color-primary)', fontSize: 16 }}>
                  {formatCurrency(Number(amount))}
                </strong>
              </div>
              <div className={styles.bankRow}>
                <span>Nội dung CK</span>
                <button type="button" className={styles.copyBtn} onClick={() => copy(deposit.paymentCode, 'nội dung CK')}>
                  {deposit.paymentCode} <IconCopy />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.sidebarColumn}>
            {/* QR Code */}
            <div className={styles.qrPreview}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Quét QR để chuyển khoản nhanh
              </p>
              <div className={styles.qrFrame}>
                <QRCodeSVG
                  value={`VIETCOMBANK|${MOCK_BANK.accountNumber}|${MOCK_BANK.accountName}|${amount}|${deposit.paymentCode}`}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
                <div className={styles.qrLogo}>₫</div>
              </div>
            </div>

            <p className={styles.hint}>
              ⚠️ Chuyển khoản <strong>đúng số tiền và nội dung</strong> để được xác nhận tự động.
            </p>
          </div>
        </div>
      )}

      {/* STEP 2 — Success */}
      {step === 2 && (
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h2>Nạp tiền thành công!</h2>
          <p>
            <span className={`${styles.statusBadge} ${styles.successBadge}`}>
              +{formatCurrency(Number(amount))}
            </span>
          </p>
          <p>Số dư đã được cập nhật vào ví của bạn</p>
        </div>
      )}
    </SubPageShell>
  );
}
