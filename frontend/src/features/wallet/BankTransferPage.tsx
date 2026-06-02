import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import api, { unwrap } from '../../shared/services/api';
import { useToast } from '../../shared/context/ToastContext';
import { getApiErrorMessage } from '../../shared/utils/apiError';
import { formatCurrency } from '../../shared/utils/format';
import { useAppSelector } from '../../app/hooks';
import styles from './BankTransferPage.module.css';

// ─── Constants ─────────────────────────────────────────────────────────────
const DAILY_LIMIT = 50_000_000;
const OTP_DURATION = 60;
const MAX_OTP_ATTEMPTS = 3;
const QUICK_AMOUNTS = [500_000, 1_000_000, 2_000_000, 5_000_000];
const TRANSFER_FEE = 0; // free

type TransferType = 'domestic' | 'international';


type Step =
  | 'type'       // 1. Chọn loại CK
  | 'account'    // 2. Chọn ngân hàng + STK + tra tên
  | 'amount'     // 3. Nhập số tiền & nội dung
  | 'confirm'    // 4. Xem lại & xác nhận
  | 'otp'        // 5. OTP / PIN
  | 'result';    // 6. Kết quả

interface BankCatalogItem { code: string; name: string; shortName: string; }

const BANK_COLORS: Record<string, string> = {
  VCB: '#1565C0', TCB: '#B71C1C', BIDV: '#1B5E20', VTB: '#E65100',
  ACB: '#1A237E', MB: '#4A148C', VPB: '#0D47A1', TPB: '#880E4F',
  STB: '#4E342E', HDB: '#006064', VIB: '#1B5E20', SHB: '#004D40',
  OCB: '#E65100', MSB: '#1A237E', LPB: '#33691E',
  VNPAY: '#005BAA',
};

function bankColor(code: string): string {
  return BANK_COLORS[code?.toUpperCase()] ?? '#334155';
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Component ─────────────────────────────────────────────────────────────
export function BankTransferPage() {
  const authUser = useAppSelector((s) => s.auth.user);
  if (authUser?.role === 'admin') return <Navigate to="/admin" replace />;

  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Global state ──────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('type');
  const [transferType, setTransferType] = useState<TransferType>('domestic');
  const [bankSearch, setBankSearch] = useState('');

  // Bank selection
  const [selectedBank, setSelectedBank] = useState<BankCatalogItem | null>(null);
  const [showBankGrid, setShowBankGrid] = useState(false);

  // Account
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');


  // Amount
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [quickActive, setQuickActive] = useState<number | null>(null);

  // OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(OTP_DURATION);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Result
  const [success, setSuccess] = useState(false);
  const [transferRef, setTransferRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────
  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => unwrap<{ id: string; balance: number }>(await api.get('/wallets')),
  });

  const { data: banks = [] } = useQuery<BankCatalogItem[]>({
    queryKey: ['banks-catalog'],
    queryFn: async () => unwrap<BankCatalogItem[]>(await api.get('/banks/catalog')),
    staleTime: Infinity,
  });


  // ── Derived ──────────────────────────────────────────────────────────
  const numAmount = Number(amount) || 0;
  const totalAmount = numAmount + TRANSFER_FEE;

  const filteredBanks = banks.filter((b) => {
    const q = bankSearch.toLowerCase();
    return !q || b.shortName.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.name.toLowerCase().includes(q);
  });

  const resolvedName = accountHolder;
  const resolvedBank = selectedBank?.shortName;
  const resolvedSTK  = accountNumber ? `****${accountNumber.slice(-4)}` : '';

  const canGoToAmount = !!selectedBank && !!accountHolder && !lookupError;

  const canConfirm = numAmount >= 1000 && numAmount <= DAILY_LIMIT && (wallet?.balance ?? 0) >= numAmount;

  // ── OTP timer ─────────────────────────────────────────────────────────
  const startOtpTimer = useCallback(() => {
    setOtpTimer(OTP_DURATION);
    setOtpExpired(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setOtpExpired(true); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (step === 'otp') startOtpTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  // ── Napas Lookup ─────────────────────────────────────────────────────
  const handleLookup = async () => {
    if (!selectedBank || !accountNumber.trim()) {
      toast('Vui lòng chọn ngân hàng và nhập số tài khoản', 'error');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    setAccountHolder('');
    try {
      const res = await api.post('/bank-accounts/lookup', {
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
      });
      const data = unwrap<{ accountName: string }>(res);
      setAccountHolder(data.accountName);
    } catch (err) {
      setLookupError(getApiErrorMessage(err, 'Không tìm thấy thông tin tài khoản'));
    } finally {
      setLookupLoading(false);
    }
  };

  // ── OTP input ─────────────────────────────────────────────────────────
  const handleOtpKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val.slice(-1);
    setOtpDigits(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const otpCode = otpDigits.join('');

  // ── Submit transfer ───────────────────────────────────────────────────
  const submitTransfer = async () => {
    if (otpCode.length !== 6) { toast('Vui lòng nhập đủ 6 chữ số OTP', 'error'); return; }
    if (otpExpired) { toast('OTP đã hết hạn. Vui lòng yêu cầu mã mới', 'error'); return; }
    if (otpAttempts >= MAX_OTP_ATTEMPTS) { toast('Vượt quá số lần thử OTP', 'error'); return; }

    setSubmitting(true);
    setOtpAttempts((a) => a + 1);
    try {
      const payload = { bankCode: selectedBank!.code, bankName: selectedBank!.shortName, accountNumber, accountName: accountHolder, amount: numAmount, description, otpCode };

      const res = await api.post('/transactions/bank-transfer', payload);
      const data = unwrap<{ reference: string }>(res);
      setTransferRef(data.reference);
      setSuccess(true);
      setStep('result');
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Giao dịch thất bại');
      if (otpAttempts + 1 >= MAX_OTP_ATTEMPTS) {
        toast(`${msg}. Đã vượt quá số lần thử.`, 'error');
        setStep('result');
        setSuccess(false);
      } else {
        toast(`${msg} (còn ${MAX_OTP_ATTEMPTS - otpAttempts - 1} lần thử)`, 'error');
        setOtpDigits(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = () => {
    setOtpDigits(['', '', '', '', '', '']);
    startOtpTimer();
    toast('Đã gửi lại mã OTP qua email', 'success');
    otpRefs.current[0]?.focus();
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const selectQuick = (a: number) => { setAmount(String(a)); setQuickActive(a); };



  const selectBankFromGrid = (b: BankCatalogItem) => {
    setSelectedBank(b);
    setShowBankGrid(false);
    setAccountHolder('');
    setLookupError('');
  };

  const STEP_LABELS = ['Loại CK', 'Tài khoản', 'Số tiền', 'Xác nhận', 'OTP', 'Kết quả'];
  const STEPS: Step[] = ['type', 'account', 'amount', 'confirm', 'otp', 'result'];
  const stepIdx = STEPS.indexOf(step);

  const goNext = () => {
    const next = STEPS[stepIdx + 1];
    if (next) setStep(next);
  };

  const goPrev = () => {
    if (step === 'result') return;
    const prev = STEPS[stepIdx - 1];
    if (prev) setStep(prev);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className={styles.pageShell}>
      {/* Header */}
      <div className={styles.header}>
        {step !== 'type' && step !== 'result' ? (
          <button className={styles.headerBack} onClick={goPrev}>←</button>
        ) : (
          <button className={styles.headerBack} onClick={() => navigate('/transfer')}>←</button>
        )}
        <div>
          <div className={styles.headerTitle}>Chuyển tiền ngân hàng</div>
          <div className={styles.headerSub}>Hệ thống Napas 247 · Xử lý tức thì</div>
        </div>
      </div>

      {/* Progress */}
      <div className={styles.progressBar}>
        {STEP_LABELS.map((label, i) => (
          <div key={i} className={styles.progressItem}>
            {i > 0 && (
              <div className={`${styles.progressLine} ${stepIdx > i - 1 ? styles.done : ''}`} />
            )}
            <div className={`${styles.progressDot} ${stepIdx === i ? styles.active : ''} ${stepIdx > i ? styles.done : ''}`}>
              {stepIdx > i ? '✓' : i + 1}
            </div>
            <span className={`${styles.progressLabel} ${stepIdx === i ? styles.active : ''} ${stepIdx > i ? styles.done : ''}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ═══ STEP 1: Transfer Type ═══════════════════════════════════════ */}
      {step === 'type' && (
        <div className={styles.layout}>
          <div className={styles.mainPanel}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>🌐</div>
                <span className={styles.cardHeaderTitle}>Chọn loại chuyển khoản</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.transferTypeRow}>
                  <button
                    type="button"
                    className={`${styles.transferTypeBtn} ${transferType === 'domestic' ? styles.transferTypeBtnActive : ''}`}
                    onClick={() => setTransferType('domestic')}
                  >
                    <span className={styles.transferTypeIcon}>🏦</span>
                    <span className={styles.transferTypeLabel}>Trong nước</span>
                    <span className={styles.transferTypeSub}>Napas 247 · Tức thì</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.transferTypeBtn} ${transferType === 'international' ? styles.transferTypeBtnActive : ''}`}
                    onClick={() => setTransferType('international')}
                  >
                    <span className={styles.transferTypeIcon}>✈️</span>
                    <span className={styles.transferTypeLabel}>Quốc tế</span>
                    <span className={styles.transferTypeSub}>SWIFT · 1–5 ngày</span>
                  </button>
                </div>

                {transferType === 'international' && (
                  <div className={styles.limitWarning}>
                    ⚠️ Chuyển tiền quốc tế cần phê duyệt riêng và áp dụng phí SWIFT. Tính năng sẽ ra mắt sớm.
                  </div>
                )}

                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={transferType === 'international'}
                  onClick={goNext}
                >
                  {transferType === 'domestic' ? 'Tiếp tục — Chọn tài khoản →' : 'Chưa hỗ trợ'}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>ℹ️</div>
                <span className={styles.cardHeaderTitle}>Thông tin giao dịch</span>
              </div>
              {[
                { icon: '⚡', text: 'Napas 247 xử lý trong vòng 10 giây' },
                { icon: '🔒', text: 'Xác thực OTP bắt buộc cho mọi giao dịch' },
                { icon: '💳', text: 'Hạn mức: 50.000.000đ / ngày' },
                { icon: '📱', text: 'Thông báo qua SMS + Email + Push' },
                { icon: '🎁', text: 'Phí chuyển: Miễn phí' },
              ].map((item, i) => (
                <div key={i} className={styles.infoItem}>
                  <span className={styles.infoItemIcon}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Account Selection ══════════════════════════════════ */}
      {step === 'account' && (
        <div className={styles.layout}>
          <div className={styles.mainPanel}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>🏦</div>
                <span className={styles.cardHeaderTitle}>Chọn ngân hàng & tài khoản đích</span>
              </div>
              <div className={styles.cardBody}>
                {/* Notice: only enter OTHER person's account */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px',
                  background: '#FFF7ED', borderRadius: 12,
                  border: '1.5px solid #FED7AA',
                  fontSize: 12.5, color: '#92400E', lineHeight: 1.6,
                  fontWeight: 500
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
                  <span>
                    Chức năng này dùng để chuyển tiền <strong>sang tài khoản ngân hàng của người khác</strong>.
                    Bạn không thể chuyển vào tài khoản ngân hàng của chính mình.
                  </span>
                </div>


                {/* ── New account entry ── */}
                <>
                    {/* Bank selector */}
                    <div>
                      <div className={styles.fieldLabel}>Chọn ngân hàng</div>
                      {selectedBank && !showBankGrid ? (
                        <div className={styles.selectedBankChip}>
                          <div className={styles.selectedBankChipLogo} style={{ background: bankColor(selectedBank.code) }}>
                            {selectedBank.code.slice(0, 3)}
                          </div>
                          <div className={styles.selectedBankChipInfo}>
                            <div className={styles.selectedBankChipName}>{selectedBank.shortName}</div>
                            <div className={styles.selectedBankChipFull}>{selectedBank.name}</div>
                          </div>
                          <button type="button" className={styles.changeBankBtn} onClick={() => setShowBankGrid(true)}>
                            Đổi
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className={styles.bankSearchBox}>
                            <span className={styles.bankSearchIcon}>🔍</span>
                            <input
                              type="text"
                              className={styles.bankSearchInput}
                              placeholder="Tìm ngân hàng..."
                              value={bankSearch}
                              onChange={(e) => setBankSearch(e.target.value)}
                            />
                          </div>
                          <div className={styles.bankGrid} style={{ marginTop: 10 }}>
                            {filteredBanks.map((b) => (
                              <button
                                key={b.code}
                                type="button"
                                className={`${styles.bankItem} ${selectedBank?.code === b.code ? styles.bankItemActive : ''}`}
                                onClick={() => selectBankFromGrid(b)}
                              >
                                <div className={styles.bankLogo} style={{ background: bankColor(b.code) }}>
                                  {b.code.slice(0, 3)}
                                </div>
                                <span className={styles.bankItemName}>{b.shortName}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Account number + lookup */}
                    {selectedBank && (
                      <div>
                        <div className={styles.fieldLabel}>Số tài khoản</div>
                        <div className={styles.accountInputWrapper}>
                          <input
                            type="number"
                            className={styles.accountInput}
                            value={accountNumber}
                            onChange={(e) => { setAccountNumber(e.target.value); setAccountHolder(''); setLookupError(''); }}
                            placeholder="Nhập số tài khoản..."
                          />
                          <button
                            type="button"
                            className={styles.lookupBtn}
                            disabled={!accountNumber.trim() || lookupLoading}
                            onClick={() => void handleLookup()}
                          >
                            {lookupLoading ? '...' : '🔍 Tra cứu'}
                          </button>
                        </div>

                        {lookupLoading && (
                          <div className={styles.lookupLoading}>
                            <div className={styles.spinner} />
                            Đang tra cứu thông tin qua Napas...
                          </div>
                        )}

                        {accountHolder && !lookupError && (
                          <div className={styles.resolvedBox}>
                            <div className={styles.resolvedAvatar}>{getInitials(accountHolder)}</div>
                            <div className={styles.resolvedInfo}>
                              <div className={styles.resolvedLabel}>Chủ tài khoản (xác minh qua Napas)</div>
                              <div className={styles.resolvedName}>{accountHolder}</div>
                              <div className={styles.resolvedBank}>{selectedBank.shortName} · {accountNumber}</div>
                            </div>
                            <div className={styles.napasTag}>⚡ Napas</div>
                          </div>
                        )}

                        {lookupError && (
                          <div className={styles.lookupError}>
                            ✕ {lookupError}
                          </div>
                        )}
                      </div>
                    )}
                  </>

                <div className={styles.btnRow}>
                  <button type="button" className={styles.ghostBtn} onClick={goPrev}>← Quay lại</button>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={!canGoToAmount}
                    onClick={goNext}
                  >
                    Tiếp tục →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sidePanel}>
            {accountHolder && (
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>👤 Thông tin tài khoản đích</div>
                <div className={styles.summaryBody}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryRowLabel}>Họ tên</span>
                    <span className={styles.summaryRowValue}>{resolvedName}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryRowLabel}>Ngân hàng</span>
                    <span className={styles.summaryRowValue}>{resolvedBank}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryRowLabel}>Số TK</span>
                    <span className={styles.summaryRowValue}>{resolvedSTK}</span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.infoCard}>
              <div className={styles.infoItem}>
                <span className={styles.infoItemIcon}>🔍</span>
                Hệ thống sẽ tự động xác minh tên chủ tài khoản qua Napas trước khi cho phép chuyển tiền.
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemIcon}>💡</span>
                Tài khoản đã lưu được xác minh và bảo mật bằng mã hóa AES-256.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Amount & Description ══════════════════════════════ */}
      {step === 'amount' && (
        <div className={styles.layout}>
          <div className={styles.mainPanel}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>💰</div>
                <span className={styles.cardHeaderTitle}>Nhập số tiền & nội dung</span>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldLabel}>Số tiền chuyển</div>
                  <div className={styles.amountRow}>
                    <span className={styles.currencyBadge}>VNĐ</span>
                    <input
                      type="number"
                      className={styles.amountInput}
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setQuickActive(null); }}
                      placeholder="Nhập số tiền..."
                      min={1000}
                    />
                  </div>
                </div>

                <div className={styles.quickAmounts}>
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className={`${styles.quickBtn} ${quickActive === a ? styles.quickBtnActive : ''}`}
                      onClick={() => selectQuick(a)}
                    >
                      {a >= 1_000_000 ? `${a / 1_000_000}M` : `${a / 1000}K`}
                    </button>
                  ))}
                </div>

                <div className={styles.balanceInfo}>
                  <span className={styles.balanceLabel}>Số dư khả dụng</span>
                  <span className={styles.balanceValue}>{formatCurrency(wallet?.balance ?? 0)} đ</span>
                </div>

                {numAmount > (wallet?.balance ?? 0) && numAmount > 0 && (
                  <div className={styles.limitWarning}>
                    ⚠️ Số tiền vượt quá số dư khả dụng. Vui lòng nạp thêm tiền vào ví.
                  </div>
                )}

                {numAmount > DAILY_LIMIT && (
                  <div className={styles.limitWarning}>
                    ⚠️ Vượt hạn mức ngày ({formatCurrency(DAILY_LIMIT)} đ). Vui lòng chia nhỏ giao dịch.
                  </div>
                )}

                <div>
                  <div className={styles.fieldLabel}>Nội dung chuyển khoản</div>
                  <textarea
                    className={styles.descriptionInput}
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Chuyen tien thang ${new Date().getMonth() + 1} ${new Date().getFullYear()}`}
                    maxLength={80}
                  />
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0', textAlign: 'right' }}>
                    {description.length}/80
                  </p>
                </div>

                <div className={styles.btnRow}>
                  <button type="button" className={styles.ghostBtn} onClick={goPrev}>← Quay lại</button>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={!canConfirm}
                    onClick={goNext}
                  >
                    Xem lại giao dịch →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>📋 Tóm tắt giao dịch</div>
              <div className={styles.summaryBody}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Người nhận</span>
                  <span className={styles.summaryRowValue}>{resolvedName || '—'}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Ngân hàng</span>
                  <span className={styles.summaryRowValue}>{resolvedBank || '—'}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Số TK</span>
                  <span className={styles.summaryRowValue}>{resolvedSTK || '—'}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Số tiền</span>
                  <span className={styles.summaryRowValue}>{numAmount > 0 ? `${formatCurrency(numAmount)} đ` : '—'}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Phí giao dịch</span>
                  <span className={styles.summaryRowGreen}>Miễn phí</span>
                </div>
              </div>
              {numAmount > 0 && (
                <div className={styles.summaryTotal}>
                  <span className={styles.summaryTotalLabel}>Tổng cộng</span>
                  <span className={styles.summaryTotalValue}>{formatCurrency(totalAmount)} đ</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 4: Confirm ════════════════════════════════════════════ */}
      {step === 'confirm' && (
        <div className={styles.layout}>
          <div className={styles.mainPanel}>
            <div className={styles.card}>
              <div className={styles.confirmHeader}>
                <div className={styles.confirmAmountLabel}>Số tiền chuyển</div>
                <div className={styles.confirmAmount}>{formatCurrency(numAmount)} đ</div>
                <div className={styles.confirmAmountNote}>Phí giao dịch: Miễn phí · Tổng: {formatCurrency(totalAmount)} đ</div>
              </div>
              <div className={styles.confirmBody}>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>Người nhận</span>
                  <strong className={styles.confirmRowValue}>{resolvedName}</strong>
                </div>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>Ngân hàng đích</span>
                  <strong className={styles.confirmRowValue}>{resolvedBank}</strong>
                </div>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>Số tài khoản</span>
                  <strong className={styles.confirmRowValue}>{resolvedSTK}</strong>
                </div>
                {description && (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmRowLabel}>Nội dung</span>
                    <strong className={styles.confirmRowValue}>{description}</strong>
                  </div>
                )}
                <div className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>Loại chuyển</span>
                  <strong className={styles.confirmRowValue}>
                    {transferType === 'domestic' ? 'Trong nước (Napas 247)' : 'Quốc tế (SWIFT)'}
                  </strong>
                </div>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmRowLabel}>Phí giao dịch</span>
                  <strong className={styles.confirmRowValue} style={{ color: '#059669' }}>Miễn phí</strong>
                </div>
                <div className={styles.confirmTotal}>
                  <span className={styles.confirmTotalLabel}>Tổng tiền giao dịch</span>
                  <span className={styles.confirmTotalValue}>{formatCurrency(totalAmount)} đ</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A', fontSize: 13, color: '#92400E', display: 'flex', gap: 8 }}>
              🔒 Sau khi xác nhận, bạn sẽ nhận mã OTP qua email để hoàn tất giao dịch.
            </div>

            <div className={styles.btnRow}>
              <button type="button" className={styles.ghostBtn} onClick={goPrev}>← Quay lại</button>
              <button type="button" className={styles.primaryBtn} onClick={goNext}>
                🔒 Xác nhận & Nhận OTP
              </button>
            </div>
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>🛡️ Thông tin bảo mật</div>
              <div className={styles.summaryBody}>
                {[
                  '✓ Kết nối SSL 256-bit',
                  '✓ Giao dịch qua Napas 247',
                  '✓ OTP xác thực 1 lần',
                  '✓ Tự động hủy sau 60 giây',
                  '✓ Ghi nhật ký đầy đủ',
                ].map((item, i) => (
                  <div key={i} className={styles.summaryRow}>
                    <span style={{ color: '#059669', fontWeight: 600, fontSize: 13 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 5: OTP ════════════════════════════════════════════════ */}
      {step === 'otp' && (
        <div className={styles.layout}>
          <div className={styles.mainPanel}>
            <div className={styles.otpCard}>
              <div className={styles.otpHeader}>
                <div className={styles.otpHeaderIcon}>🔐</div>
                <div className={styles.otpHeaderTitle}>Xác thực OTP</div>
                <div className={styles.otpHeaderDesc}>
                  Mã OTP đã được gửi đến email <strong>{authUser?.email}</strong>
                </div>
              </div>
              <div className={styles.otpBody}>
                {/* OTP digit inputs */}
                <div className={styles.otpInputRow}>
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={styles.otpDigit}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className={styles.otpTimer}>
                  <span>Hiệu lực:</span>
                  <span className={`${styles.otpTimerValue} ${otpExpired ? styles.otpTimerExpired : ''}`}>
                    {otpExpired ? 'Hết hạn' : formatTime(otpTimer)}
                  </span>
                </div>

                {/* Attempts */}
                {otpAttempts > 0 && (
                  <div className={styles.otpAttempts}>
                    ⚠️ Đã thử {otpAttempts}/{MAX_OTP_ATTEMPTS} lần
                  </div>
                )}

                {/* Resend */}
                <button
                  type="button"
                  className={styles.resendBtn}
                  disabled={!otpExpired && otpTimer > 0 && otpAttempts === 0}
                  onClick={resendOtp}
                >
                  {otpExpired ? '📨 Gửi lại mã OTP' : `Gửi lại (${formatTime(otpTimer)})`}
                </button>

                <div className={styles.btnRow}>
                  <button type="button" className={styles.ghostBtn} onClick={goPrev}>← Quay lại</button>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={otpCode.length !== 6 || submitting || otpExpired || otpAttempts >= MAX_OTP_ATTEMPTS}
                    onClick={() => void submitTransfer()}
                  >
                    {submitting ? '⏳ Đang xử lý...' : '✅ Xác nhận chuyển tiền'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>📋 Chi tiết giao dịch</div>
              <div className={styles.summaryBody}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Người nhận</span>
                  <span className={styles.summaryRowValue}>{resolvedName}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Ngân hàng</span>
                  <span className={styles.summaryRowValue}>{resolvedBank}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Số tiền</span>
                  <span className={styles.summaryRowValue}>{formatCurrency(numAmount)} đ</span>
                </div>
              </div>
              <div className={styles.summaryTotal}>
                <span className={styles.summaryTotalLabel}>Tổng cộng</span>
                <span className={styles.summaryTotalValue}>{formatCurrency(totalAmount)} đ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 6: Result ═════════════════════════════════════════════ */}
      {step === 'result' && (
        <div className={styles.layout}>
          <div style={{ width: '100%' }}>
            <div className={styles.successWrapper}>
              {success ? (
                <>
                  <div className={styles.successCircle}>✓</div>
                  <div className={styles.successTitle}>Chuyển tiền thành công!</div>
                  <div className={styles.successAmount}>-{formatCurrency(numAmount)} đ</div>
                  <div className={styles.receiptCard}>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Người nhận</span>
                      <span className={styles.receiptValue}>{resolvedName}</span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Ngân hàng</span>
                      <span className={styles.receiptValue}>{resolvedBank}</span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Số TK</span>
                      <span className={styles.receiptValue}>{resolvedSTK}</span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Số tiền</span>
                      <span className={styles.receiptValue} style={{ color: '#EF4444' }}>
                        -{formatCurrency(numAmount)} đ
                      </span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Phí</span>
                      <span className={styles.receiptValue} style={{ color: '#059669' }}>Miễn phí</span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Mã tham chiếu</span>
                      <span className={styles.receiptValue} style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {transferRef}
                      </span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Thời gian</span>
                      <span className={styles.receiptValue}>{new Date().toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 300 }}>
                    {['📱 Thông báo đã gửi qua SMS', '📧 Biên nhận đã gửi qua Email', '🔔 Push notification đã gửi'].map((item, i) => (
                      <div key={i} className={styles.notificationRow}>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.failedCircle}>✕</div>
                  <div className={styles.successTitle} style={{ color: '#DC2626' }}>Giao dịch thất bại</div>
                  <p style={{ fontSize: 14, color: '#64748B', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
                    Giao dịch không thể thực hiện. Vui lòng kiểm tra lại thông tin và thử lại.
                  </p>
                </>
              )}
              <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 360 }}>
                {success && (
                  <button type="button" className={styles.ghostBtn} style={{ flex: 1 }} onClick={() => navigate('/transactions')}>
                    Xem lịch sử
                  </button>
                )}
                <button type="button" className={styles.primaryBtn} style={{ flex: 1 }} onClick={() => navigate('/dashboard')}>
                  Về trang chủ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
