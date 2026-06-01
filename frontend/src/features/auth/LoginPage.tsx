import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { unwrap } from '../../shared/services/api';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from './authSlice';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import styles from './AuthPages.module.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
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
      setError(ax.response?.data?.message || 'Email hoặc mật khẩu không đúng');
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
      <form className={styles.card} onSubmit={handleSubmit}>
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
      </form>
    </div>
  );
}
