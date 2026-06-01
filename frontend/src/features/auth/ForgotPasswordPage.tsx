import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../shared/services/api';
import { extractResponseData, getApiErrorMessage } from '../../shared/utils/apiError';
import { useToast } from '../../shared/context/ToastContext';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import styles from './AuthPages.module.css';

type Step = 'request' | 'reset';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const passwordMismatch = useMemo(() => {
    if (!confirmPassword) return false;
    return newPassword !== confirmPassword;
  }, [newPassword, confirmPassword]);

  const requestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const data = extractResponseData<{ devOtp?: string }>(res);
      setDevOtp(data.devOtp ?? null);
      toast(
        data.devOtp
          ? 'OTP dev đã tạo — xem mã bên dưới'
          : 'Nếu email tồn tại, OTP đã được gửi. Kiểm tra hộp thư.',
        'success',
      );
      setStep('reset');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể gửi OTP. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordMismatch) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('Mật khẩu cần tối thiểu 8 ký tự, 1 chữ in hoa và 1 số');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        email,
        code,
        newPassword,
      });
      toast('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.', 'success');
      navigate('/login');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể đặt lại mật khẩu'));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const data = extractResponseData<{ devOtp?: string }>(res);
      setDevOtp(data.devOtp ?? null);
      toast('OTP đã được gửi lại.', 'success');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể gửi lại OTP'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <div className={styles.logo}>HKi</div>
        <h1>Quên mật khẩu</h1>
        <p>Nhận OTP qua email để đặt lại mật khẩu</p>
      </div>

      <form className={styles.card} onSubmit={step === 'request' ? requestOtp : resetPassword}>
        {step === 'request' ? (
          <>
            <h2>Gửi OTP</h2>
            {error && <p className={styles.error}>{error}</p>}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi OTP'}
            </Button>
          </>
        ) : (
          <>
            <h2>Đặt lại mật khẩu</h2>
            <p className={styles.hintText}>Nhập OTP 6 số đã gửi tới {email}</p>
            {devOtp && (
              <p className={styles.devOtpBanner}>
                Mã OTP (dev): <strong>{devOtp}</strong>
              </p>
            )}
            {error && <p className={styles.error}>{error}</p>}
            <Input
              label="Mã OTP"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              required
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự, 1 HOA, 1 số"
              required
            />
            <Input
              label="Nhập lại mật khẩu mới"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={passwordMismatch ? 'Mật khẩu xác nhận không khớp' : ''}
              required
            />
            <div className={styles.inlineActions}>
              <Button type="button" variant="ghost" onClick={resend} disabled={loading}>
                Gửi lại OTP
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang xác nhận...' : 'Xác nhận'}
              </Button>
            </div>
            <p className={styles.passwordHint}>Mật khẩu: tối thiểu 8 ký tự, có chữ in hoa và số (vd: Abc12345).</p>
          </>
        )}

        <p className={styles.footerLink}>
          <Link to="/login">Quay lại đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
