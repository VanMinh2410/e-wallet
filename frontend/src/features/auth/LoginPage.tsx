import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { unwrap } from '../../shared/services/api';
import { extractResponseData, getApiErrorMessage } from '../../shared/utils/apiError';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from './authSlice';
import { useToast } from '../../shared/context/ToastContext';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import styles from './AuthPages.module.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Verification states
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = unwrap<{
        accessToken: string;
        user: { id: string; fullName: string; email: string; phone: string; role: string; isVerified: boolean };
      }>(res);
      dispatch(setCredentials({ accessToken: data.accessToken, user: { ...data.user, id: data.user.id } }));
      navigate('/dashboard');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message || 'Email hoặc mật khẩu không đúng';
      setError(msg);
      
      if (msg === 'Vui lòng xác minh email trước khi đăng nhập') {
        handleResendOtp(email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (emailToResend: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/resend-otp', { email: emailToResend });
      const data = extractResponseData<{ devOtp?: string }>(res);
      setDevOtp(data.devOtp ?? null);
      toast('Mã OTP đã được gửi tới email của bạn.', 'success');
      setStep('verify');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể gửi OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      unwrap(await api.post('/auth/verify-otp', { email, code: otp }));
      toast('Xác minh thành công! Đang đăng nhập...', 'success');
      // Auto-login after verification
      const loginRes = await api.post('/auth/login', { email, password });
      const data = unwrap<{
        accessToken: string;
        user: { id: string; fullName: string; email: string; phone: string; role: string; isVerified: boolean };
      }>(loginRes);
      dispatch(setCredentials({ accessToken: data.accessToken, user: { ...data.user, id: data.user.id } }));
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'OTP không hợp lệ'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <div className={styles.logo}>HKi</div>
        <h1>HKi Wallet</h1>
        <p>Ví điện tử an toàn · Nhanh chóng</p>
      </div>
      <form className={styles.card} onSubmit={step === 'login' ? handleLogin : handleVerify}>
        {step === 'login' ? (
          <>
            <h2>Đăng nhập</h2>
            {error && <p className={styles.error}>{error}</p>}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
            <Input label="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            <Button type="submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
            <p className={styles.footerLink}>
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </p>
            <p className={styles.footerLink}>
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
          </>
        ) : (
          <div className={styles.otpStep}>
            <h2>Xác minh OTP</h2>
            <p>Nhập mã 6 số đã gửi tới {email}</p>
            {devOtp && (
              <p className={styles.devOtpBanner}>
                Mã OTP (dev): <strong>{devOtp}</strong>
              </p>
            )}
            {error && <p className={styles.error}>{error}</p>}
            <Input
              className={styles.otpInput}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
            />
            <div className={styles.inlineActions}>
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={() => handleResendOtp(email)}
              >
                Gửi lại OTP
              </Button>
              <Button type="submit" disabled={loading}>{loading ? '...' : 'Xác minh'}</Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
