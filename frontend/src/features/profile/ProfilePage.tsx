import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { unwrap } from '../../shared/services/api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout } from '../auth/authSlice';
import { useToast } from '../../shared/context/ToastContext';
import { Button } from '../../shared/components/ui/Button';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import styles from './ProfilePage.module.css';

interface LinkedBank {
  id: string;
  bankName: string;
  accountNumberMasked: string;
  isVerified: boolean;
}

export function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Modals & form states
  const [infoOpen, setInfoOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [pwd, setPwd] = useState({ current: '', new: '' });
  const [bankForm, setBankForm] = useState({ bankCode: 'VCB', bankName: 'Vietcombank', accountNumber: '', accountName: '' });
  const [limitInput, setLimitInput] = useState('100');

  // Interactive settings states
  const [bioEnabled, setBioEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [language, setLanguage] = useState('Tiếng Việt');
  const [dailyLimit, setDailyLimit] = useState(100); // in millions

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () =>
      unwrap<{ fullName: string; email: string; phone: string; kycStatus: string }>(await api.get('/users/profile')),
  });

  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () =>
      unwrap<LinkedBank[]>(await api.get('/bank-accounts')),
  });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      dispatch(logout());
      navigate('/login');
      toast('Đăng xuất thành công', 'info');
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/users/password', pwd);
      toast('Đổi mật khẩu thành công', 'success');
      setPwdOpen(false);
      setPwd({ current: '', new: '' });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast(ax.response?.data?.message || 'Đổi mật khẩu thất bại', 'error');
    }
  };

  const addBank = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/bank-accounts', bankForm);
      qc.invalidateQueries({ queryKey: ['banks'] });
      toast('Đã liên kết tài khoản ngân hàng', 'success');
      setBankOpen(false);
      setBankForm({ bankCode: 'VCB', bankName: 'Vietcombank', accountNumber: '', accountName: '' });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast(ax.response?.data?.message || 'Liên kết thất bại', 'error');
    }
  };

  const handleToggleBio = () => {
    setBioEnabled(!bioEnabled);
    toast(`Sinh trắc học: ${!bioEnabled ? 'Đã bật' : 'Đã tắt'}`, 'success');
  };

  const handleToggleNotif = () => {
    setNotifEnabled(!notifEnabled);
    toast(`Thông báo đẩy: ${!notifEnabled ? 'Đã bật' : 'Đã tắt'}`, 'success');
  };

  const handleToggleLanguage = () => {
    const next = language === 'Tiếng Việt' ? 'English' : 'Tiếng Việt';
    setLanguage(next);
    toast(`Ngôn ngữ đã đổi thành: ${next}`, 'success');
  };

  const handleLimitSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = Number(limitInput);
    if (isNaN(val) || val <= 0) {
      toast('Hạn mức phải là số dương hợp lệ', 'error');
      return;
    }
    setDailyLimit(val);
    setLimitOpen(false);
    toast(`Đã cập nhật hạn mức ngày thành ${val} triệu VND`, 'success');
  };

  const kycStatus = profile?.kycStatus ?? user?.kycStatus ?? 'approved'; // default mock as approved like mockup

  return (
    <div className={styles.container}>
      {/* 🔵 BLUE HERO HEADER BANNER */}
      <div className={styles.hero}>
        <div className={styles.avatarCircle}>
          {(profile?.fullName?.[0] ?? user?.fullName?.[0] ?? 'V').toUpperCase()}
        </div>
        <h2 className={styles.profileName}>{profile?.fullName ?? user?.fullName ?? 'Nguyễn Văn An'}</h2>
        <p className={styles.profileId}>ID: 2024-VNB-04821</p>
        
        {/* Dynamic KYC status check matching layout */}
        <span
          className={`${styles.kycBadge} ${
            kycStatus === 'approved' ? '' : kycStatus === 'pending' ? styles.kycPending : styles.kycNone
          }`}
        >
          ✓ Đã xác minh KYC
        </span>
      </div>

      {/* ⚙️ MAIN CONTROLLER LIST */}
      <div className={styles.content}>
        {/* BLOCK 1: Account & Core Credentials */}
        <div className={styles.menuBlock}>
          {/* Account Profile info */}
          <button type="button" className={styles.menuItem} onClick={() => setInfoOpen(true)}>
            <div className={styles.itemLeft}>
              <div className={styles.iconWrapper} style={{ backgroundColor: '#E0F2FE' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className={styles.itemLabel}>Thông tin tài khoản</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.chevron}>›</span>
            </div>
          </button>

          {/* Password changing */}
          <button type="button" className={styles.menuItem} onClick={() => setPwdOpen(true)}>
            <div className={styles.itemLeft}>
              <div className={styles.iconWrapper} style={{ backgroundColor: '#F3E8FF' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span className={styles.itemLabel}>Bảo mật & Mật khẩu</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.chevron}>›</span>
            </div>
          </button>

          {/* Biometrics biometric fingerprint */}
          <button type="button" className={styles.menuItem} onClick={handleToggleBio}>
            <div className={styles.itemLeft}>
              <div className={styles.iconWrapper} style={{ backgroundColor: '#DCFCE7' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
                  <path d="M12 2a10 10 0 0 0-10 10c0 2.2.8 4.2 2.1 5.7" />
                  <path d="M12 6a6 6 0 0 0-6 6c0 1.3.5 2.5 1.3 3.4" />
                  <path d="M12 10a2 2 0 0 0-2 2" />
                  <path d="M14.1 19.5c1.2-1.2 1.9-2.8 1.9-4.5 0-3.3-2.7-6-6-6s-6 2.7-6 6" />
                  <path d="M18 12a6 6 0 0 1-1.3 3.7" />
                </svg>
              </div>
              <span className={styles.itemLabel}>Vân tay / Face ID</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.itemValue}>{bioEnabled ? 'Đang bật' : 'Đang tắt'}</span>
              <span className={styles.chevron}>›</span>
            </div>
          </button>
        </div>

        {/* BLOCK 2: Limits & Personalization */}
        <div className={styles.menuBlock}>
          {/* Limits setup */}
          <button type="button" className={styles.menuItem} onClick={() => { setLimitInput(String(dailyLimit)); setLimitOpen(true); }}>
            <div className={styles.itemLeft}>
              <div className={styles.iconWrapper} style={{ backgroundColor: '#FEF3C7' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <span className={styles.itemLabel}>Hạn mức giao dịch</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.itemValue}>{dailyLimit}tr/ngày</span>
              <span className={styles.chevron}>›</span>
            </div>
          </button>

          {/* Push alerts */}
          <button type="button" className={styles.menuItem} onClick={handleToggleNotif}>
            <div className={styles.itemLeft}>
              <div className={styles.iconWrapper} style={{ backgroundColor: '#FCE7F3' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2.5">
                  <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <span className={styles.itemLabel}>Thông báo đẩy</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.itemValue}>{notifEnabled ? 'Đang bật' : 'Đang tắt'}</span>
              <span className={styles.chevron}>›</span>
            </div>
          </button>

          {/* Language selector */}
          <button type="button" className={styles.menuItem} onClick={handleToggleLanguage}>
            <div className={styles.itemLeft}>
              <div className={styles.iconWrapper} style={{ backgroundColor: '#DCFCE7' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <span className={styles.itemLabel}>Ngôn ngữ</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.itemValue}>{language}</span>
              <span className={styles.chevron}>›</span>
            </div>
          </button>
        </div>

        {/* BLOCK 3: Help & Exit */}
        <div className={styles.menuBlock}>
          {/* Helpdesk */}
          <button type="button" className={styles.menuItem} onClick={() => setHelpOpen(true)}>
            <div className={styles.itemLeft}>
              <div className={styles.iconWrapper} style={{ backgroundColor: '#E0F2FE' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <span className={styles.itemLabel}>Hỗ trợ 24/7</span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.chevron}>›</span>
            </div>
          </button>

          {/* Exit logout */}
          <button type="button" className={styles.menuItem} onClick={handleLogout}>
            <div className={styles.itemLeft}>
              <div className={styles.iconWrapper} style={{ backgroundColor: '#FEE2E2' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <span className={`${styles.itemLabel} ${styles.logoutText}`}>Đăng xuất</span>
            </div>
          </button>
        </div>
      </div>

      {/* 🗂️ ACCOUNT INFO & LINKED BANKS MODAL */}
      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title="Thông tin tài khoản">
        <div className={styles.infoModal}>
          <div className={styles.infoField}>
            <span className={styles.infoLabel}>Họ và tên</span>
            <span className={styles.infoValue}>{profile?.fullName ?? user?.fullName}</span>
          </div>
          <div className={styles.infoField}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{profile?.email ?? user?.email}</span>
          </div>
          <div className={styles.infoField}>
            <span className={styles.infoLabel}>Số điện thoại</span>
            <span className={styles.infoValue}>{profile?.phone ?? user?.phone ?? 'Chưa cập nhật'}</span>
          </div>

          <div className={styles.bankSectionHeader}>
            <h4>Ngân hàng đã liên kết</h4>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setInfoOpen(false);
                setBankOpen(true);
              }}
              style={{ fontSize: 11, padding: '4px 8px' }}
            >
              ＋ Liên kết
            </Button>
          </div>

          <div className={styles.bankList}>
            {banks && banks.length > 0 ? (
              banks.map((b) => (
                <div key={b.id} className={styles.bankCardItem}>
                  <div className={styles.bankCardInfo}>
                    <span className={styles.bankCardName}>{b.bankName}</span>
                    <span className={styles.bankCardNumber}>{b.accountNumberMasked}</span>
                  </div>
                  {b.isVerified && <span className={styles.bankVerifiedBadge}>Đã xác minh</span>}
                </div>
              ))
            ) : (
              <p style={{ fontStyle: 'italic', fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
                Chưa liên kết ngân hàng nào
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* 🔒 PASSWORD MODAL */}
      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title="Đổi mật khẩu">
        <form onSubmit={changePassword}>
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            value={pwd.current}
            onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
            required
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            value={pwd.new}
            onChange={(e) => setPwd({ ...pwd, new: e.target.value })}
            required
          />
          <Button type="submit" style={{ marginTop: 16, background: '#0C447C' }}>Lưu thay đổi</Button>
        </form>
      </Modal>

      {/* 🏦 ADD LINKED BANK MODAL */}
      <Modal open={bankOpen} onClose={() => setBankOpen(false)} title="Liên kết ngân hàng">
        <form onSubmit={addBank}>
          <Input
            label="Mã ngân hàng (VD: VCB, TCB)"
            value={bankForm.bankCode}
            onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })}
            required
          />
          <Input
            label="Tên ngân hàng"
            value={bankForm.bankName}
            onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
            required
          />
          <Input
            label="Số tài khoản"
            value={bankForm.accountNumber}
            onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
            required
          />
          <Input
            label="Tên chủ tài khoản"
            value={bankForm.accountName}
            onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
            required
          />
          <Button type="submit" style={{ marginTop: 16, background: '#0C447C' }}>Liên kết ngay</Button>
        </form>
      </Modal>

      {/* 💰 TRANSACTION LIMIT MODAL */}
      <Modal open={limitOpen} onClose={() => setLimitOpen(false)} title="Hạn mức giao dịch">
        <form onSubmit={handleLimitSubmit}>
          <Input
            label="Hạn mức ngày (triệu VND/ngày)"
            type="number"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            required
          />
          <Button type="submit" style={{ marginTop: 16, background: '#0C447C' }}>Cập nhật</Button>
        </form>
      </Modal>

      {/* 🎧 HELP SUPPORT MODAL */}
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Hỗ trợ 24/7">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
          <p style={{ margin: 0, fontSize: 13.5, color: '#475569', lineHeight: 1.5 }}>
            Nếu bạn gặp khó khăn trong quá trình sử dụng ví VBANK, vui lòng liên hệ với bộ phận hỗ trợ khách hàng để được giải đáp ngay lập tức:
          </p>
          <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>Hotline:</span>
              <strong style={{ color: '#0C447C' }}>1900 6868</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>Email:</span>
              <strong style={{ color: '#0C447C' }}>support@vbank.dev</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>Thời gian:</span>
              <strong style={{ color: '#16A34A' }}>24 giờ/ngày (bao gồm lễ Tết)</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

