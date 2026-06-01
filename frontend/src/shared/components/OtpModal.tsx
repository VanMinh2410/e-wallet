import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../services/api';
import { extractResponseData, getApiErrorMessage } from '../utils/apiError';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import styles from './OtpModal.module.css';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 120; // 2 minutes

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => Promise<void>;
  title?: string;
  /** Gửi OTP giao dịch qua email (API backend) */
  transactionOtp?: boolean;
  /** Email người dùng để hiển thị hint (tùy chọn) */
  userEmail?: string;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  return `${user[0]}***@${domain}`;
}

export function OtpModal({
  open,
  onClose,
  onVerified,
  title = 'Xác thực OTP',
  transactionOtp = false,
  userEmail,
}: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [hint, setHint] = useState('Đang gửi mã OTP...');
  const [countdown, setCountdown] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const code = digits.join('');

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const sendOtp = useCallback(async () => {
    if (!transactionOtp) return;
    try {
      const res = await api.post('/auth/transaction-otp/send');
      const data = extractResponseData<{ devOtp?: string; emailSent?: boolean }>(res);
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setHint('Chế độ phát triển — dùng mã OTP bên dưới');
      } else {
        setDevOtp(null);
        const emailHint = userEmail ? maskEmail(userEmail) : 'email của bạn';
        setHint(`Mã OTP đã gửi đến ${emailHint}`);
      }
      startCountdown();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không gửi được OTP'));
    }
  }, [transactionOtp, userEmail, startCountdown]);

  useEffect(() => {
    if (!open) return;
    setDigits(Array(OTP_LENGTH).fill(''));
    setError('');
    setDevOtp(null);
    setHint('Đang gửi mã OTP...');
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
    void sendOtp();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, sendOtp]);

  const handleInput = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    setError('');
    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'Enter' && code.length === OTP_LENGTH) {
      void handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      e.preventDefault();
      const next = Array(OTP_LENGTH).fill('');
      pasted.split('').forEach((c, i) => { next[i] = c; });
      setDigits(next);
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  const handleVerify = async () => {
    if (code.length !== OTP_LENGTH) {
      setError('Vui lòng nhập đủ 6 số');
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (transactionOtp) {
        await api.post('/auth/transaction-otp/verify', { code });
      }
      await onVerified();
      setDigits(Array(OTP_LENGTH).fill(''));
      setDevOtp(null);
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Mã OTP không đúng'));
      triggerShake();
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleResend = async () => {
    if (countdown > 0 || !transactionOtp) return;
    setLoading(true);
    setError('');
    setDigits(Array(OTP_LENGTH).fill(''));
    await sendOtp();
    setLoading(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {/* Icon */}
      <div className={styles.iconWrapper}>
        <div className={styles.iconCircle}>🔒</div>
      </div>

      {/* Hint */}
      <p className={styles.hint}>{hint}</p>

      {/* Dev OTP */}
      {devOtp && (
        <div className={styles.devOtp}>
          <span className={styles.devLabel}>🛠 Dev Mode</span>
          <strong className={styles.devCode}>{devOtp}</strong>
        </div>
      )}

      {/* 6-box OTP input */}
      <div className={`${styles.otpBoxes} ${shake ? styles.shake : ''}`} onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            className={`${styles.otpBox} ${d ? styles.otpBoxFilled : ''} ${error ? styles.otpBoxError : ''}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`Ký tự OTP thứ ${i + 1}`}
            id={`otp-digit-${i}`}
          />
        ))}
      </div>

      {/* Error */}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {/* Resend */}
      {transactionOtp && (
        <div className={styles.resendRow}>
          {countdown > 0 ? (
            <span className={styles.countdown}>
              Gửi lại sau <strong>{formatCountdown(countdown)}</strong>
            </span>
          ) : (
            <button
              type="button"
              className={styles.resendBtn}
              onClick={() => void handleResend()}
              disabled={loading}
            >
              Gửi lại mã OTP
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={() => void handleVerify()}
          disabled={loading || code.length < OTP_LENGTH}
        >
          {loading ? 'Đang xác minh...' : 'Xác nhận'}
        </Button>
      </div>
    </Modal>
  );
}
