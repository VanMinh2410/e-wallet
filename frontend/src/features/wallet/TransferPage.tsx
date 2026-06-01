import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import api, { unwrap } from '../../shared/services/api';
import { useToast } from '../../shared/context/ToastContext';
import { getApiErrorMessage } from '../../shared/utils/apiError';
import { SubPageShell } from '../../shared/components/Layout/SubPageShell';
import { StepBar } from '../../shared/components/ui/StepBar';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { OtpModal } from '../../shared/components/OtpModal';
import { formatCurrency } from '../../shared/utils/format';
import { useAppSelector } from '../../app/hooks';
import styles from './FlowPages.module.css';

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];
const OTP_THRESHOLD = 500_000; // OTP khi chuyển từ 500K

type TransferMode = 'wallet' | 'bank';

interface BankCatalogItem {
  code: string;
  name: string;
  shortName: string;
}

interface LinkedBank {
  id: string;
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNumberMasked: string;
}

export function TransferPage() {
  const user = useAppSelector((s) => s.auth.user);
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [mode, setMode] = useState<TransferMode>('wallet');
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [linkedBankId, setLinkedBankId] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => unwrap<{ id: string; balance: number }>(await api.get('/wallets')),
  });

  const userEmail = useAppSelector((s) => s.auth.user?.email);

  const { data: bankCatalog } = useQuery({
    queryKey: ['bank-catalog'],
    queryFn: async () => unwrap<BankCatalogItem[]>(await api.get('/banks/catalog')),
  });

  const { data: linkedBanks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => unwrap<LinkedBank[]>(await api.get('/bank-accounts')),
  });

  const numAmount = Number(amount) || 0;

  const selectLinkedBank = (bank: LinkedBank) => {
    setLinkedBankId(bank.id);
    setBankCode(bank.bankCode);
    setBankName(bank.bankName);
    setAccountName(bank.accountName);
    setAccountNumber('');
  };

  const selectCatalogBank = (code: string) => {
    const item = bankCatalog?.find((b) => b.code === code);
    if (!item) return;
    setLinkedBankId('');
    setBankCode(item.code);
    setBankName(item.shortName);
  };

  const bankFormValid =
    numAmount >= 10000 &&
    bankCode &&
    bankName &&
    accountName &&
    (linkedBankId || accountNumber.length >= 6);

  const walletFormValid = recipient.trim().length > 0 && numAmount >= 1000;

  const executeTransfer = async () => {
    if (!wallet?.id) return;
    setLoading(true);
    try {
      if (mode === 'wallet') {
        const res = await api.post(
          `/wallets/${wallet.id}/transfers`,
          { recipient, amount: numAmount, description },
          { headers: { 'X-Idempotency-Key': uuidv4() } },
        );
        const data = unwrap<{ reference: string }>(res);
        setReference(data.reference);
      } else {
        const body = linkedBankId
          ? { bankAccountId: linkedBankId, amount: numAmount, description }
          : { bankCode, bankName, accountNumber, accountName, amount: numAmount, description };
        const res = await api.post('/transactions/bank-transfer', body);
        const data = unwrap<{ reference: string }>(res);
        setReference(data.reference);
      }
      setStep(2);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast('Chuyển tiền thành công!', 'success');
    } catch (err: unknown) {
      toast(getApiErrorMessage(err, 'Chuyển tiền thất bại'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (numAmount >= OTP_THRESHOLD) {
      setOtpOpen(true);
    } else {
      void executeTransfer();
    }
  };

  const canContinue = mode === 'wallet' ? walletFormValid : bankFormValid;

  const footer =
    step === 0 ? (
      <Button onClick={() => setStep(1)} disabled={!canContinue}>
        Tiếp tục →
      </Button>
    ) : step === 1 ? (
      <Button onClick={handleConfirm} disabled={loading}>
        {loading ? 'Đang xử lý...' : numAmount >= OTP_THRESHOLD ? '🔒 Xác nhận & OTP' : 'Xác nhận chuyển'}
      </Button>
    ) : (
      <Button onClick={() => navigate('/dashboard')}>Về trang chủ</Button>
    );

  return (
    <SubPageShell title="Chuyển tiền" footer={footer}>
      {/* Mode tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${mode === 'wallet' ? styles.tabActive : ''}`}
          onClick={() => { setMode('wallet'); setStep(0); }}
        >
          🏦 Ví HKi
        </button>
        <button
          type="button"
          className={`${styles.tab} ${mode === 'bank' ? styles.tabActive : ''}`}
          onClick={() => { setMode('bank'); setStep(0); }}
        >
          🏛 Ngân hàng
        </button>
      </div>

      <StepBar steps={['Nhập liệu', 'Xác nhận', 'Hoàn tất']} current={step} />

      {/* STEP 0 — Wallet */}
      {step === 0 && mode === 'wallet' && (
        <div className={styles.desktopGrid}>
          <div className={styles.formColumn}>
            <div className={styles.formSection}>
              <Input
                label="Người nhận (Email hoặc SĐT)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="user@email.com hoặc 09xx..."
              />
              <Input
                label="Lời nhắn (tùy chọn)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Chuyển tiền ăn trưa..."
              />
            </div>
          </div>
          <div className={styles.sidebarColumn}>
            <AmountSection amount={amount} setAmount={setAmount} balance={wallet?.balance} min={1000} />
          </div>
        </div>
      )}

      {/* STEP 0 — Bank */}
      {step === 0 && mode === 'bank' && (
        <div className={styles.desktopGrid}>
          <div className={styles.formColumn}>
            <div className={styles.formSection}>
              <label className={styles.amountLabel}>Ngân hàng</label>
              <select
                className={styles.select}
                value={bankCode}
                onChange={(e) => selectCatalogBank(e.target.value)}
              >
                <option value="">-- Chọn ngân hàng --</option>
                {bankCatalog?.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.shortName} ({b.code})
                  </option>
                ))}
              </select>

              {!linkedBankId && (
                <>
                  <Input
                    label="Số tài khoản"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nhập số tài khoản người nhận"
                  />
                  <Input
                    label="Tên chủ tài khoản"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="NGUYEN VAN A"
                  />
                </>
              )}

              {linkedBankId && (
                <p className={styles.hint}>
                  Đang chuyển tới tài khoản đã lưu.{' '}
                  <button type="button" className={styles.linkBtn} onClick={() => setLinkedBankId('')}>
                    Nhập STK khác
                  </button>
                </p>
              )}

              <Input
                label="Nội dung chuyển (tùy chọn)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thanh toán dịch vụ..."
              />
            </div>
          </div>

          <div className={styles.sidebarColumn}>
            {linkedBanks && linkedBanks.length > 0 && (
              <div className={styles.savedBanksSection}>
                <label className={styles.amountLabel}>Tài khoản đã lưu</label>
                <div className={styles.savedBanksList}>
                  {linkedBanks.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`${styles.bankAccountCard} ${linkedBankId === b.id ? styles.bankAccountCardActive : ''}`}
                      onClick={() => selectLinkedBank(b)}
                    >
                      <div className={styles.bankAccountIcon}>🏦</div>
                      <div className={styles.bankAccountInfo}>
                        <div className={styles.bankAccountName}>{b.bankName}</div>
                        <div className={styles.bankAccountNum}>{b.accountName} · {b.accountNumberMasked}</div>
                      </div>
                      {linkedBankId === b.id && <div className={styles.bankAccountCheck}>✓</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AmountSection amount={amount} setAmount={setAmount} balance={wallet?.balance} min={10000} />

            {!linkedBanks?.length && (
              <p className={styles.hint}>
                <Link to="/profile">Lưu tài khoản ngân hàng</Link> để chuyển nhanh lần sau.
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 1 — Confirm */}
      {step === 1 && (
        <div className={styles.confirmCard}>
          <div className={styles.confirmCardHeader}>
            <div className={styles.confirmAmountLabel}>Số tiền chuyển</div>
            <div className={styles.confirmAmount}>{formatCurrency(numAmount)}</div>
          </div>

          {mode === 'wallet' ? (
            <div className={styles.confirmRow}>
              <span>Người nhận</span>
              <strong>{recipient}</strong>
            </div>
          ) : (
            <>
              <div className={styles.confirmRow}>
                <span>Ngân hàng</span>
                <strong>{bankName}</strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Số tài khoản</span>
                <strong>
                  {linkedBankId
                    ? linkedBanks?.find((b) => b.id === linkedBankId)?.accountNumberMasked
                    : accountNumber}
                </strong>
              </div>
              <div className={styles.confirmRow}>
                <span>Chủ tài khoản</span>
                <strong>{accountName}</strong>
              </div>
            </>
          )}
          {description && (
            <div className={styles.confirmRow}>
              <span>Nội dung</span>
              <strong>{description}</strong>
            </div>
          )}
          <div className={styles.confirmRow}>
            <span>Phí giao dịch</span>
            <strong style={{ color: 'var(--color-success)' }}>Miễn phí</strong>
          </div>

          {numAmount >= OTP_THRESHOLD && (
            <div className={styles.otpWarning}>
              <span className={styles.otpWarningIcon}>🔒</span>
              Giao dịch sẽ yêu cầu xác thực OTP qua email
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — Success */}
      {step === 2 && (
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h2>Chuyển tiền thành công!</h2>
          <p>Giao dịch đã được xử lý</p>
          <code className={styles.refCode}>{reference}</code>
          {mode === 'bank' && (
            <p className={styles.hint} style={{ marginTop: 12 }}>
              Chuyển ngân hàng đang được xử lý (1–2 ngày làm việc).
            </p>
          )}
        </div>
      )}

      <OtpModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        onVerified={executeTransfer}
        transactionOtp
        userEmail={userEmail}
        title="Xác thực OTP giao dịch"
      />
    </SubPageShell>
  );
}

function AmountSection({
  amount,
  setAmount,
  balance,
  min = 1000,
}: {
  amount: string;
  setAmount: (v: string) => void;
  balance?: number;
  min?: number;
}) {
  return (
    <>
      <div className={styles.amountSection}>
        <label className={styles.amountLabel}>Số tiền</label>
        <div className={styles.amountInputWrapper}>
          <span className={styles.amountCurrency}>₫</span>
          <input
            className={styles.amountInput}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min={min}
          />
        </div>
        <div className={styles.quickAmounts}>
          {QUICK_AMOUNTS.map((a) => (
            <button key={a} type="button" className={styles.chip} onClick={() => setAmount(String(a))}>
              {a >= 1_000_000 ? `${a / 1_000_000}M` : `${a / 1000}K`}
            </button>
          ))}
        </div>
      </div>
      <p className={styles.hint}>💰 Số dư khả dụng: <strong>{formatCurrency(balance ?? 0)}</strong></p>
    </>
  );
}
