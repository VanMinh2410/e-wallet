import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { unwrap } from '../../shared/services/api';
import { extractResponseData, getApiErrorMessage } from '../../shared/utils/apiError';
import { useToast } from '../../shared/context/ToastContext';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import styles from './AuthPages.module.css';

export function RegisterPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      const data = extractResponseData<{ devOtp?: string }>(res);
      setDevOtp(data.devOtp ?? null);
      toast(
        data.devOtp
          ? 'Đăng ký thành công! Dùng mã OTP hiển thị bên dưới (chế độ dev).'
          : 'Đăng ký thành công! Kiểm tra OTP trong email của bạn.',
        'success',
      );
      setStep('verify');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      unwrap(await api.post('/auth/verify-otp', { email: form.email, code: otp }));
      toast('Xác minh email thành công!', 'success');
      navigate('/login');
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
        <h1>Tạo tài khoản</h1>
        <p>Tham gia HKi Wallet miễn phí</p>
      </div>
      <form className={styles.card} onSubmit={step === 'register' ? handleRegister : handleVerify}>
        {step === 'register' ? (
          <>
            <h2>Đăng ký</h2>
            {error && <p className={styles.error}>{error}</p>}
            <Input label="Họ và tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxx" required />
            <Input label="Mật khẩu" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Button type="submit" disabled={loading}>{loading ? '...' : 'Tiếp tục'}</Button>
          </>
        ) : (
          <div className={styles.otpStep}>
            <h2>Xác minh OTP</h2>
            <p>Nhập mã 6 số đã gửi tới {form.email}</p>
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
                onClick={async () => {
                  setLoading(true);
                  setError('');
                  try {
                    const res = await api.post('/auth/resend-otp', { email: form.email });
                    const data = extractResponseData<{ devOtp?: string }>(res);
                    setDevOtp(data.devOtp ?? null);
                    toast('OTP đã được gửi lại.', 'success');
                  } catch (err: unknown) {
                    setError(getApiErrorMessage(err, 'Không thể gửi lại OTP'));
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Gửi lại OTP
              </Button>
              <Button type="submit" disabled={loading}>{loading ? '...' : 'Xác minh'}</Button>
            </div>
          </div>
        )}
        <p className={styles.footerLink}>
          <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
