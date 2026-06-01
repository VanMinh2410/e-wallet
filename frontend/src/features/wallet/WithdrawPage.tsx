import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { unwrap } from '../../shared/services/api';
import { useToast } from '../../shared/context/ToastContext';
import { SubPageShell } from '../../shared/components/Layout/SubPageShell';
import { StepBar } from '../../shared/components/ui/StepBar';
import { Button } from '../../shared/components/ui/Button';
import { OtpModal } from '../../shared/components/OtpModal';
import { formatCurrency } from '../../shared/utils/format';
import { useAppSelector } from '../../app/hooks';
import styles from './FlowPages.module.css';

const QUICK_WITHDRAW = [100_000, 200_000, 500_000, 1_000_000, 2_000_000];
const OTP_THRESHOLD = 100_000; // OTP cho mọi lệnh rút >= 100K

export function WithdrawPage() {
  const user = useAppSelector((s) => s.auth.user);
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState('');
  const [bankId, setBankId] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => unwrap<{ balance: number }>(await api.get('/wallets')),
  });

  const userEmail = useAppSelector((s) => s.auth.user?.email);

  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () =>
      unwrap<Array<{ id: string; bankName: string; accountNumberMasked: string; accountName: string; isVerified: boolean }>>(
        await api.get('/bank-accounts'),
      ),
  });

  const numAmount = Number(amount) || 0;
  const selectedBank = banks?.find((b) => b.id === bankId);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/transactions/withdraw', {
        amount: numAmount,
        bankAccountId: bankId || undefined,
      });
      const data = unwrap<{ reference: string }>(res);
      setReference(data.reference);
      setStep(2);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      toast('Yêu cầu rút tiền đã gửi', 'success');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast(ax.response?.data?.message || 'Rút tiền thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (numAmount >= OTP_THRESHOLD) {
      setOtpOpen(true);
    } else {
      void submit();
    }
  };

  const canContinue = numAmount >= 10000 && (!!bankId || (banks && banks.length === 0));

  const footer =
    step === 0 ? (
      <Button onClick={() => setStep(1)} disabled={!canContinue}>
        Tiếp tục →
      </Button>
    ) : step === 1 ? (
      <Button onClick={handleConfirm} disabled={loading}>
        {loading ? 'Đang xử lý...' : numAmount >= OTP_THRESHOLD ? '🔒 Xác nhận & OTP' : 'Xác nhận rút tiền'}
      </Button>
    ) : null;

  return (
    <SubPageShell title="Rút tiền" footer={footer}>
      <StepBar steps={['Thông tin', 'Xác nhận', 'Hoàn tất']} current={step} />

      {/* STEP 0 */}
      {step === 0 && (
        <div className={styles.desktopGrid}>
          <div className={styles.formColumn}>
            <div className={styles.formSection}>
              <label className={styles.amountLabel}>Tài khoản nhận</label>

              {banks?.length ? (
                banks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`${styles.bankAccountCard} ${bankId === b.id ? styles.bankAccountCardActive : ''}`}
                    onClick={() => setBankId(b.id)}
                  >
                    <div className={styles.bankAccountIcon}>🏦</div>
                    <div className={styles.bankAccountInfo}>
                      <div className={styles.bankAccountName}>{b.bankName}</div>
                      <div className={styles.bankAccountNum}>
                        {b.accountName} · {b.accountNumberMasked}
                        {b.isVerified && <span style={{ color: 'var(--color-success)', marginLeft: 6 }}>✓ Đã xác minh</span>}
                      </div>
                    </div>
                    {bankId === b.id && <div className={styles.bankAccountCheck}>✓</div>}
                  </button>
                ))
              ) : (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border-strong)',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏦</div>
                  <p className={styles.hint} style={{ marginBottom: 8 }}>Chưa liên kết ngân hàng</p>
                  <Link to="/profile" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    Thêm tài khoản ngân hàng →
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sidebarColumn}>
            <div className={styles.form}>
              <div className={styles.amountSection}>
                <label className={styles.amountLabel}>Số tiền rút</label>
                <div className={styles.amountInputWrapper}>
                  <span className={styles.amountCurrency}>₫</span>
                  <input
                    className={styles.amountInput}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={10000}
                    placeholder="0"
                    id="withdraw-amount"
                  />
                </div>
                <div className={styles.quickAmounts}>
                  {QUICK_WITHDRAW.map((a) => (
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
              <p className={styles.hint}>
                💰 Khả dụng: <strong>{formatCurrency(wallet?.balance ?? 0)}</strong>
              </p>
            </div>

            <p className={styles.hint}>
              ⏰ Thời gian xử lý dự kiến: <strong>1–2 ngày làm việc</strong> (cần admin duyệt)
            </p>
            {numAmount >= OTP_THRESHOLD && (
              <p className={styles.hint} style={{ color: 'var(--color-warning)' }}>
                🔒 Giao dịch rút tiền sẽ yêu cầu xác thực OTP qua email
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 1 — Confirm */}
      {step === 1 && (
        <div className={styles.confirmCard}>
          <div className={styles.confirmCardHeader}>
            <div className={styles.confirmAmountLabel}>Số tiền rút</div>
            <div className={styles.confirmAmount}>{formatCurrency(numAmount)}</div>
          </div>

          {selectedBank && (
            <>
              <div className={styles.confirmRow}>
                <span>Ngân hàng</span>
                <strong>{selectedBank.bankName}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Số tài khoản</span>
                <strong>{selectedBank.accountNumberMasked}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Chủ tài khoản</span>
                <strong>{selectedBank.accountName}</strong>
              </div>
            </>
          )}
          <div className={styles.confirmRow}>
            <span>Phí</span>
            <strong style={{ color: 'var(--color-success)' }}>Miễn phí</strong>
          </div>
          <div className={styles.confirmRow}>
            <span>Trạng thái</span>
            <strong style={{ color: 'var(--tx-withdraw-color)' }}>⏳ Chờ admin duyệt</strong>
          </div>

          {numAmount >= OTP_THRESHOLD && (
            <div className={styles.otpWarning}>
              <span className={styles.otpWarningIcon}>🔒</span>
              Xác thực OTP qua email bắt buộc
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — Success */}
      {step === 2 && (
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h2>Yêu cầu đã gửi!</h2>
          <span className={`${styles.statusBadge} ${styles.pending}`}>⏳ Chờ admin duyệt</span>
          <p style={{ marginTop: 12 }}>
            Mã giao dịch
          </p>
          <code className={styles.refCode}>{reference}</code>
          <p className={styles.hint} style={{ marginTop: 12 }}>
            Admin sẽ duyệt trong 1–2 ngày làm việc. Bạn sẽ nhận thông báo khi hoàn tất.
          </p>
        </div>
      )}

      <OtpModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        onVerified={submit}
        transactionOtp
        userEmail={userEmail}
        title="Xác thực OTP rút tiền"
      />
    </SubPageShell>
  );
}
