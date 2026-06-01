import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import api, { unwrap } from '../../shared/services/api';
import { useToast } from '../../shared/context/ToastContext';
import { formatDate } from '../../shared/utils/format';
import { useAppSelector } from '../../app/hooks';
import styles from './AdminPage.module.css';

type AdminTab =
  | 'overview'
  | 'reports'
  | 'monitoring'
  | 'users'
  | 'transactions'
  | 'banks'
  | 'loans'
  | 'aml'
  | 'fraud'
  | 'compliance'
  | 'settings'
  | 'permissions'
  | 'logs';

interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  kycStatus: string;
  createdAt: string;
}

interface AdminTx {
  _id: string;
  reference: string;
  type: string;
  status: string;
  amount: number;
  createdAt: string;
}

interface Analytics {
  userCount: number;
  txCount: number;
  pendingWithdraw: number;
  totalDeposit: number;
  totalWithdraw: number;
}

interface AdminBankAccount {
  id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  } | null;
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isVerified: boolean;
  createdAt: string;
}

const TX_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Nạp tiền',
  WITHDRAW: 'Rút tiền',
  TRANSFER: 'Chuyển ví',
  BANK_TRANSFER: 'Chuyển NH',
  PAYMENT: 'QR Pay',
};

const TX_STATUS_STYLE: Record<string, string> = {
  SUCCESS: styles.statusSuccess,
  PENDING: styles.statusPending,
  PROCESSING: styles.statusProcessing,
  CANCELLED: styles.statusCancelled,
  FAILED: styles.statusFailed,
};

const TX_STATUS_LABELS: Record<string, string> = {
  SUCCESS: 'Thành công',
  PENDING: 'Chờ duyệt',
  PROCESSING: 'Đang xử lý',
  CANCELLED: 'Đã hủy',
  FAILED: 'Thất bại',
};

const RenderSvgIcon = ({ path, className, style }: { path: string; className?: string; style?: React.CSSProperties }) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);

export function AdminPage() {
  const authUser = useAppSelector((s) => s.auth.user);

  if (authUser && authUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const [tab, setTab] = useState<AdminTab>('overview');
  const [txType, setTxType] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [bankPage, setBankPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom interactive alerts list
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'critical',
      tab: 'aml' as const,
      title: 'Nghi vấn rửa tiền',
      desc: 'TK 0192****8841 — 42 giao dịch nhỏ liên tiếp trong 2h',
      details: 'Hệ thống phát hiện tài khoản 019288338841 thực hiện liên tiếp 42 giao dịch chuyển tiền với giá trị ngẫu nhiên từ 10.000đ đến 50.000đ trong vòng 2 giờ qua. Đây là hành vi điển hình của hoạt động kiểm thử tài khoản hoặc chia nhỏ số tiền để rửa tiền (smurfing).',
      time: '14:30',
      path: 'M12 2L2 22h20L12 2z M12 9v4 M12 17h.01'
    },
    {
      id: 2,
      type: 'critical',
      tab: 'fraud' as const,
      title: 'Thẻ bị báo cáo gian lận',
      desc: '3 thẻ bị khóa khẩn cấp sau giao dịch nước ngoài',
      details: 'Hệ thống liên kết thanh toán quốc tế ghi nhận 3 thẻ Visa/Mastercard liên kết với ví bị báo cáo gian lận bởi ngân hàng phát hành sau khi thực hiện giao dịch bất thường tại IP nước ngoài.',
      time: '13:55',
      path: 'M1 10h22 M23 4H1v16h22V4z M2 2l20 20'
    },
    {
      id: 3,
      type: 'warning',
      tab: 'aml' as const,
      title: 'Giao dịch chờ duyệt',
      desc: 'Chuyển khoản ≥500M cần phê duyệt cấp 2 (8 GD)',
      details: '8 giao dịch chuyển khoản đi có giá trị lớn hơn hoặc bằng 500,000,000đ đang chờ người quản trị cấp cao phê duyệt thủ công theo chính sách phòng chống rửa tiền VietBank.',
      time: '13:40',
      path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2'
    },
    {
      id: 4,
      type: 'warning',
      tab: 'aml' as const,
      title: 'KYC chưa hoàn chỉnh',
      desc: '127 tài khoản hết hạn xác minh danh tính',
      details: '127 người dùng chưa cập nhật lại giấy tờ tùy thân (CCCD/Hộ chiếu) hết hạn hoặc hình ảnh tải lên bị mờ, không khớp nhận diện khuôn mặt.',
      time: '12:00',
      path: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
    },
    {
      id: 5,
      type: 'info',
      tab: 'compliance' as const,
      title: 'Bảo trì hệ thống',
      desc: 'Lịch bảo trì lỗi ngân hàng: 02:00–04:00 ngày mai',
      details: 'Thông báo kế hoạch bảo trì cổng thanh toán NAPAS kết nối VietBank. Tất cả giao dịch liên ngân hàng sẽ tạm ngưng trong khoảng thời gian bảo trì.',
      time: '09:00',
      path: 'M2 3h20v14H2z M8 21h8 M12 17v4'
    },
  ]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [otpThreshold, setOtpThreshold] = useState('500,000');
  const [systemMaintenance, setSystemMaintenance] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);

  const qc = useQueryClient();
  const { toast } = useToast();

  // Analytics
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => unwrap<Analytics>(await api.get('/admin/analytics/overview')),
  });

  // Users
  const { data: users } = useQuery({
    queryKey: ['admin-users', userPage, userSearch],
    queryFn: async () =>
      unwrap<{ items: AdminUser[]; total: number }>(
        await api.get('/admin/users', { params: { page: userPage, limit: 15, search: userSearch || undefined } }),
      ),
    enabled: tab === 'users',
  });

  // Bank Accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ['admin-bank-accounts', bankPage],
    queryFn: async () => unwrap<{ items: AdminBankAccount[]; total: number }>(await api.get('/admin/bank-accounts', { params: { page: bankPage, limit: 15 } })),
    enabled: tab === 'banks',
  });

  // All transactions
  const { data: txs } = useQuery({
    queryKey: ['admin-transactions', txPage, txType, txStatus],
    queryFn: async () =>
      unwrap<{ items: AdminTx[]; total: number }>(
        await api.get('/admin/transactions', {
          params: { page: txPage, limit: 15, type: txType || undefined, status: txStatus || undefined },
        }),
      ),
    enabled: tab === 'transactions' || tab === 'overview',
  });

  const toggleBan = async (userId: string, isActive: boolean) => {
    try {
      await api.post(`/admin/users/${userId}/${isActive ? 'ban' : 'unban'}`);
      toast(isActive ? '🚫 Đã khóa tài khoản' : '✅ Đã mở khóa', 'success');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch {
      toast('Thao tác thất bại', 'error');
    }
  };

  const toggleVerifyBank = async (id: string, isVerified: boolean) => {
    try {
      await api.post(`/admin/bank-accounts/${id}/verify`, { isVerified: !isVerified });
      toast(!isVerified ? '✅ Đã xác minh tài khoản ngân hàng' : 'ℹ️ Đã hủy xác minh', 'success');
      qc.invalidateQueries({ queryKey: ['admin-bank-accounts'] });
    } catch {
      toast('Thao tác thất bại', 'error');
    }
  };

  const deleteBankLink = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa liên kết ngân hàng này không?')) return;
    try {
      await api.delete(`/admin/bank-accounts/${id}`);
      toast('🗑 Đã xóa liên kết ngân hàng', 'success');
      qc.invalidateQueries({ queryKey: ['admin-bank-accounts'] });
    } catch {
      toast('Thao tác thất bại', 'error');
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (tab === 'users') {
      setUserSearch(val);
      setUserPage(1);
    }
  };



  // Local filtering for tables when typing
  const filteredTxs = txs?.items.filter(tx => {
    if (!searchTerm || tab === 'users') return true;
    const term = searchTerm.toLowerCase();
    return (
      tx.reference.toLowerCase().includes(term) ||
      (TX_TYPE_LABELS[tx.type] || '').toLowerCase().includes(term) ||
      tx.amount.toString().includes(term)
    );
  }) ?? [];

  const filteredBanks = bankAccounts?.items.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.userId?.fullName?.toLowerCase().includes(term) ||
      b.userId?.email?.toLowerCase().includes(term) ||
      b.bankCode.toLowerCase().includes(term) ||
      b.bankName.toLowerCase().includes(term) ||
      b.accountName.toLowerCase().includes(term) ||
      b.accountNumber.includes(term)
    );
  }) ?? [];



  interface NavigationItem {
    key: AdminTab;
    label: string;
    icon: string;
    badgeCount?: number;
  }

  interface NavigationGroup {
    title: string;
    items: NavigationItem[];
  }

  const GROUPS: NavigationGroup[] = [
    {
      title: 'Tổng quan',
      items: [
        { key: 'overview', label: 'Dashboard', icon: 'M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zM3 16h7v5H3v-5z' },
        { key: 'reports', label: 'Báo cáo', icon: 'M18 20V10M12 20V4M6 20v-6' },
        { key: 'monitoring', label: 'Giám sát', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
      ],
    },
    {
      title: 'Vận hành',
      items: [
        { key: 'users', label: 'Người dùng', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
        { key: 'transactions', label: 'Giao dịch', icon: 'M12 6v6l4 2 M22 12A10 10 0 1112 2M12 2v20' },
        { key: 'banks', label: 'Ngân hàng', icon: 'M2 5h20v14H2z M2 10h20' },
        { key: 'loans', label: 'Khoản vay', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
      ],
    },
    {
      title: 'Rủi ro',
      items: [
        { key: 'aml', label: 'Cảnh báo AML', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', badgeCount: alerts.length },
        { key: 'fraud', label: 'Kiểm soát gian lận', icon: 'M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z M12 8v4 M12 16h.01' },
        { key: 'compliance', label: 'Tuân thủ', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3' },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        { key: 'settings', label: 'Cấu hình', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 3v3 M12 18v3' },
        { key: 'permissions', label: 'Phân quyền', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 3v3 M12 18v3' },
        { key: 'logs', label: 'Nhật ký', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
      ],
    },
  ];

  const CHART_DATA = [
    { hour: '08h', val: 1240, percent: '45%' },
    { hour: '09h', val: 1850, percent: '65%' },
    { hour: '10h', val: 2480, percent: '90%' },
    { hour: '11h', val: 2100, percent: '78%' },
    { hour: '12h', val: 950, percent: '35%' },
    { hour: '13h', val: 1420, percent: '52%' },
    { hour: '14h', val: 2150, percent: '80%' },
    { hour: '15h', val: 2750, percent: '98%' },
    { hour: '16h', val: 1900, percent: '70%' },
    { hour: '17h', val: 1180, percent: '42%' },
  ];

  const activeTabLabel = GROUPS.flatMap(g => g.items).find(i => i.key === tab)?.label || 'Dashboard';

  return (
    <div className={styles.adminContainer}>
      
      {/* ==========================================
           1. SIDEBAR (LEFT COLUMN)
           ========================================== */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoIcon}>
            <RenderSvgIcon path="M5 21V10m4 11V10m6 11V10m4 11V10 M2 10l10-7 10 7 M3 21h18" />
          </div>
          <div className={styles.logoText}>
            <h1>VietBank</h1>
            <p>Admin Portal</p>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {GROUPS.map((group, gIdx) => (
            <div key={gIdx} className={styles.navGroup}>
              <div className={styles.navGroupTitle}>{group.title}</div>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.navItem} ${tab === item.key ? styles.navItemActive : ''}`}
                  onClick={() => { setTab(item.key); setSearchTerm(''); }}
                >
                  <span className={styles.navItemContent}>
                    <RenderSvgIcon path={item.icon} className={styles.navIcon} />
                    {item.label}
                  </span>
                  {!!item.badgeCount && <span className={styles.badgeAlert}>{item.badgeCount}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <footer className={styles.sidebarFooter}>
          <div className={styles.userAvatar}>AD</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{authUser?.fullName || 'Phan Minh Anh'}</div>
            <div className={styles.userRole}>Quản trị hệ thống</div>
          </div>
        </footer>
      </aside>

      {/* ==========================================
           2. MAIN CONTENT WRAPPER (RIGHT SCREEN)
           ========================================== */}
      <div className={styles.mainWrapper}>
        
        {/* Topbar Header */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h2 className={styles.pageTitle}>{activeTabLabel}</h2>
            <div className={styles.searchContainer}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm giao dịch, KH, số tài khoản..."
              />
            </div>
          </div>

          <div className={styles.topbarRight}>
            <div className={`${styles.statusPill} ${systemMaintenance ? styles.statusPillMaintenance : ''}`}>
              <span className={`${styles.statusDot} ${systemMaintenance ? styles.statusDotMaintenance : ''}`}></span>
              {systemMaintenance ? 'Hệ thống bảo trì' : 'Hệ thống ổn định'}
            </div>
            
            {/* Notifications Dropdown */}
            <div className={styles.dropdownWrapper}>
              <button 
                type="button" 
                className={styles.topbarBtn} 
                title="Thông báo" 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSettings(false);
                }}
              >
                <svg className={styles.topbarBtnIcon} viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {alerts.length > 0 && <span className={styles.dotBadge}></span>}
              </button>

              {showNotifications && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownTitle}>
                    <span>Thông báo hoạt động ({alerts.length})</span>
                    <button 
                      type="button" 
                      onClick={() => setShowNotifications(false)}
                      style={{ border: 'none', background: 'none', fontSize: 10, cursor: 'pointer', color: 'var(--color-text-muted)', fontWeight: 600 }}
                    >
                      Đóng
                    </button>
                  </div>
                  <div className={styles.dropdownList}>
                    {alerts.map((n) => (
                      <div 
                        key={n.id} 
                        className={styles.dropdownItem}
                        onClick={() => {
                          setTab(n.tab);
                          setSelectedAlertId(n.id);
                          setShowNotifications(false);
                          toast(`🔍 Đã chuyển tới danh mục: ${n.title}`, 'info');
                        }}
                      >
                        <div className={styles.dropdownItemHeader}>
                          <span style={{ color: n.type === 'critical' ? '#EF4444' : 'var(--color-text)', fontWeight: 700 }}>{n.title}</span>
                          <span>{n.time}</span>
                        </div>
                        <div className={styles.dropdownItemDesc}>{n.desc}</div>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <div style={{ padding: 12, textAlign: 'center', color: 'var(--color-text-light)', fontSize: 11 }}>
                        Không có thông báo mới
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings/Configuration Dropdown */}
            <div className={styles.dropdownWrapper}>
              <button 
                type="button" 
                className={styles.topbarBtn} 
                title="Cấu hình hệ thống" 
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifications(false);
                }}
              >
                <svg className={styles.topbarBtnIcon} viewBox="0 0 24 24">
                  <path d="M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h7 M9 8h6 M17 16h6" />
                </svg>
              </button>

              {showSettings && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownTitle}>
                    <span>Cấu hình cổng VietBank</span>
                    <button 
                      type="button" 
                      onClick={() => setShowSettings(false)}
                      style={{ border: 'none', background: 'none', fontSize: 10, cursor: 'pointer', color: 'var(--color-text-muted)', fontWeight: 600 }}
                    >
                      Đóng
                    </button>
                  </div>
                  
                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>Ngưỡng OTP Giao dịch (VND)</label>
                    <input 
                      type="text" 
                      className={styles.settingInput} 
                      value={otpThreshold} 
                      onChange={(e) => setOtpThreshold(e.target.value)} 
                    />
                  </div>

                  <div className={styles.settingGroup}>
                    <div className={styles.settingToggle}>
                      <span className={styles.settingLabel}>Chế độ bảo trì hệ thống</span>
                      <label className={styles.toggleSwitch}>
                        <input 
                          type="checkbox" 
                          checked={systemMaintenance} 
                          onChange={(e) => {
                            setSystemMaintenance(e.target.checked);
                            toast(e.target.checked ? '🛠️ Đã kích hoạt chế độ bảo trì hệ thống!' : '✅ Hệ thống đã hoạt động bình thường', e.target.checked ? 'info' : 'success');
                          }}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className={styles.actionBtn}
                    style={{ padding: '6px 12px', fontSize: 11, height: 'auto', backgroundColor: '#1A5999', color: '#FFFFFF', borderColor: '#1A5999', marginTop: 8 }}
                    onClick={() => {
                      setShowSettings(false);
                      toast('⚙️ Đã lưu cấu hình cổng VietBank thành công!', 'success');
                    }}
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ==========================================
             MAIN SCROLLABLE BODY (620px HEIGHT)
             ========================================== */}
        <main className={styles.contentBody}>
          
          {/* LAYER 1: 4 METRIC CARDS */}
          <section className={styles.metricsGrid}>
            <div className={`${styles.card} ${styles.metricCard}`}>
              <span className={styles.metricTitle}>Giao dịch hôm nay</span>
              <div className={styles.metricValue}>
                {analytics ? (analytics.txCount).toLocaleString() : '14,832'}
              </div>
              <div className={`${styles.metricFooter} ${styles.trendUp}`}>
                <span>↑ +8.4%</span>
                <span style={{ color: 'var(--color-text-light)', fontWeight: 400 }}>so hôm qua</span>
              </div>
            </div>

            <div className={`${styles.card} ${styles.metricCard}`}>
              <span className={styles.metricTitle}>Dịch (Tỷ VND)</span>
              <div className={styles.metricValue}>
                {analytics ? ((analytics.totalDeposit + analytics.totalWithdraw) / 1_000_000_000).toFixed(1) : '2.4'}
              </div>
              <div className={`${styles.metricFooter} ${styles.trendUp}`}>
                <span>↑ +12.1%</span>
                <span style={{ color: 'var(--color-text-light)', fontWeight: 400 }}>so tuần trước</span>
              </div>
            </div>

            <div className={`${styles.card} ${styles.metricCard}`}>
              <span className={styles.metricTitle}>Hàng hoạt động</span>
              <div className={styles.metricValue}>
                {analytics ? (analytics.userCount).toLocaleString() : '98,204'}
              </div>
              <div className={`${styles.metricFooter} ${styles.trendUp}`}>
                <span>↑ +340 mới</span>
                <span style={{ color: 'var(--color-text-light)', fontWeight: 400 }}>hôm nay</span>
              </div>
            </div>

            <div className={`${styles.card} ${styles.metricCard}`}>
              <span className={styles.metricTitle}>Chờ xử lý</span>
              <div className={`${styles.metricValue} ${styles.highlightRed}`}>
                {alerts.length}
              </div>
              <div className={`${styles.metricFooter} ${styles.trendAlert}`}>
                <RenderSvgIcon path="M12 2L2 22h20L12 2z M12 9v4 M12 17h.01" style={{ width: 12, height: 12 }} />
                <span>{alerts.filter(a => a.type === 'critical').length} ưu tiên cao</span>
              </div>
            </div>
          </section>

          {/* LAYER 2: DOUBLE PANEL VIEW */}
          <div className={styles.splitGrid}>
            
            {/* LEFT WORK PANEL (DYNAMICAL ACCORDING TO TAB) */}
            <div className={styles.leftPanel}>
              
              {/* TAB: overview (Dashboard) */}
              {tab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, alignItems: 'start' }}>
                  <div className={styles.card} style={{ margin: 0 }}>
                    <div className={styles.panelHeader}>
                      <h3 className={styles.panelTitle}>Giao dịch gần đây</h3>
                      <button className={styles.panelActionLink} onClick={() => setTab('transactions')}>
                        Xem tất cả
                        <RenderSvgIcon path="M5 12h14 M12 5l7 7-7 7" style={{ width: 12, height: 12 }} />
                      </button>
                    </div>

                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Mã GD</th>
                            <th>Khách hàng</th>
                            <th>Loại</th>
                            <th>Số tiền</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTxs.slice(0, 5).map((tx) => (
                            <tr key={tx._id}>
                              <td className={styles.colId}>{tx.reference.slice(0, 12)}</td>
                              <td>
                                <div className={styles.colCustomer}>
                                  <span className={styles.customerName}>Giao dịch ví</span>
                                  <span className={styles.channelTag}>
                                    <span className={styles.channelBullet}></span>
                                    Hệ thống • {formatDate(tx.createdAt).slice(-5)}
                                  </span>
                                </div>
                              </td>
                              <td>{TX_TYPE_LABELS[tx.type] || tx.type}</td>
                              <td className={`${styles.colAmount} ${tx.type === 'DEPOSIT' ? styles.amountPositive : styles.amountNegative}`}>
                                {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}
                              </td>
                              <td>
                                <span className={`${styles.statusBadge} ${styles.success}`}>
                                  {TX_STATUS_LABELS[tx.status] || tx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(!filteredTxs || filteredTxs.length === 0) && (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-light)' }}>
                                Không có dữ liệu giao dịch
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Hourly Chart */}
                  <div className={`${styles.card} ${styles.chartCard}`} style={{ margin: 0 }}>
                    <div className={styles.panelHeader} style={{ marginBottom: 4 }}>
                      <h3 className={styles.panelTitle} style={{ fontSize: 12 }}>Số lượng giao dịch theo giờ (hôm nay)</h3>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>Tổng: 14,832 GD</span>
                    </div>

                    <div className={styles.chartContainer}>
                      {CHART_DATA.map((item, idx) => (
                        <div
                          key={idx}
                          className={styles.chartBarWrapper}
                          onClick={() => alert(`📊 Giờ ${item.hour}: ${item.val.toLocaleString()} GD`)}
                        >
                          <div className={styles.chartTooltip}>{item.hour} - {item.val.toLocaleString()} GD</div>
                          <div className={styles.chartBar} style={{ height: item.percent }}></div>
                          <span className={styles.chartLabel}>{item.hour}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: users */}
              {tab === 'users' && (
                <div className={styles.card}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Danh sách Người dùng</h3>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Người dùng</th>
                          <th>Vai trò</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users?.items.map((u) => (
                          <tr key={u._id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className={styles.userAvatar} style={{ width: 28, height: 28, fontSize: 11 }}>
                                  {u.fullName[0]?.toUpperCase() ?? '?'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 500 }}>{u.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${u.isActive ? styles.success : styles.failed}`}>
                                {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${u.isActive ? styles.actionBtnDanger : styles.actionBtnSuccess}`}
                                onClick={() => void toggleBan(u._id, u.isActive)}
                                disabled={u.role === 'admin'}
                                style={{ padding: '3px 8px', fontSize: 11, height: 'auto', lineHeight: 'normal' }}
                              >
                                {u.isActive ? 'Khóa' : 'Mở khóa'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {users && users.total > 15 && (
                    <div className={styles.pagination}>
                      <button type="button" className={styles.pageBtn} disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>← Trước</button>
                      <span className={styles.pageInfo}>Trang {userPage} / {Math.ceil(users.total / 15)}</span>
                      <button type="button" className={styles.pageBtn} disabled={(users.items.length ?? 0) < 15} onClick={() => setUserPage(p => p + 1)}>Sau →</button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: banks */}
              {tab === 'banks' && (
                <div className={styles.card}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Tài khoản Ngân hàng đã liên kết</h3>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Chủ ví (Người dùng)</th>
                          <th>Ngân hàng</th>
                          <th>Số tài khoản</th>
                          <th>Tên chủ TK</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBanks.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{b.userId?.fullName || 'N/A'}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{b.userId?.email || 'N/A'}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{b.bankCode}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{b.bankName}</div>
                            </td>
                            <td><code>{b.accountNumber}</code></td>
                            <td style={{ fontWeight: 600 }}>{b.accountName}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${b.isVerified ? styles.success : styles.pending}`}>
                                {b.isVerified ? 'Đã xác minh' : 'Chờ duyệt'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${b.isVerified ? styles.actionBtnDanger : styles.actionBtnSuccess}`}
                                  onClick={() => void toggleVerifyBank(b.id, b.isVerified)}
                                  style={{ padding: '3px 8px', fontSize: 11, height: 'auto', lineHeight: 'normal' }}
                                >
                                  {b.isVerified ? 'Hủy XM' : 'Xác minh'}
                                </button>
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => void deleteBankLink(b.id)}
                                  style={{ padding: '3px 8px', fontSize: 11, height: 'auto', lineHeight: 'normal', color: '#EF4444', borderColor: '#EF4444', background: '#FFFFFF' }}
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!filteredBanks || filteredBanks.length === 0) && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-light)' }}>
                              Không có tài khoản liên kết trùng khớp
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {bankAccounts && bankAccounts.total > 15 && (
                    <div className={styles.pagination}>
                      <button type="button" className={styles.pageBtn} disabled={bankPage <= 1} onClick={() => setBankPage(p => p - 1)}>← Trước</button>
                      <span className={styles.pageInfo}>Trang {bankPage} / {Math.ceil(bankAccounts.total / 15)}</span>
                      <button type="button" className={styles.pageBtn} disabled={(bankAccounts.items.length ?? 0) < 15} onClick={() => setBankPage(p => p + 1)}>Sau →</button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: transactions */}
              {tab === 'transactions' && (
                <div className={styles.card}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Toàn bộ Giao dịch</h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select className={styles.filterSelect} value={txType} onChange={(e) => { setTxType(e.target.value); setTxPage(1); }} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '0.5px solid var(--color-border)' }}>
                        <option value="">Tất cả loại</option>
                        <option value="DEPOSIT">Nạp tiền</option>
                        <option value="WITHDRAW">Rút tiền</option>
                        <option value="TRANSFER">Chuyển ví</option>
                        <option value="BANK_TRANSFER">Chuyển NH</option>
                        <option value="PAYMENT">QR Pay</option>
                      </select>
                      <select className={styles.filterSelect} value={txStatus} onChange={(e) => { setTxStatus(e.target.value); setTxPage(1); }} style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '0.5px solid var(--color-border)' }}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="SUCCESS">Thành công</option>
                        <option value="PENDING">Chờ duyệt</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="CANCELLED">Đã hủy</option>
                        <option value="FAILED">Thất bại</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Mã GD</th>
                          <th>Loại</th>
                          <th>Số tiền</th>
                          <th>Trạng thái</th>
                          <th>Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTxs.map((tx) => (
                          <tr key={tx._id}>
                            <td className={styles.colId}>{tx.reference.slice(0, 16)}</td>
                            <td><span className={styles.typeBadge}>{TX_TYPE_LABELS[tx.type] || tx.type}</span></td>
                            <td className={`${styles.colAmount} ${tx.type === 'DEPOSIT' ? styles.amountPositive : styles.amountNegative}`}>
                              {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}
                            </td>
                            <td>
                              <span className={`${styles.statusBadge} ${TX_STATUS_STYLE[tx.status] || ''}`}>
                                {TX_STATUS_LABELS[tx.status] || tx.status}
                              </span>
                            </td>
                            <td>{formatDate(tx.createdAt)}</td>
                          </tr>
                        ))}
                        {(!filteredTxs || filteredTxs.length === 0) && (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-light)' }}>
                              Không tìm thấy giao dịch nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {txs && txs.total > 15 && (
                    <div className={styles.pagination}>
                      <button type="button" className={styles.pageBtn} disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>← Trước</button>
                      <span className={styles.pageInfo}>Trang {txPage} / {Math.ceil(txs.total / 15)}</span>
                      <button type="button" className={styles.pageBtn} disabled={(txs.items.length ?? 0) < 15} onClick={() => setTxPage(p => p + 1)}>Sau →</button>
                    </div>
                  )}
                </div>
              )}

              {/* INTERACTIVE ALERTS TABS: aml, fraud, compliance */}
              {['aml', 'fraud', 'compliance'].includes(tab) && (
                <div className={styles.card} style={{ minHeight: 380 }}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Bàn làm việc Kiểm soát - {activeTabLabel}</h3>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
                    {/* Left side: Alert Items list in this category */}
                    <div style={{ borderRight: '0.5px solid var(--color-border)', paddingRight: 20 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--color-text-muted)' }}>Cảnh báo ({alerts.filter(a => a.tab === tab).length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {alerts.filter(a => a.tab === tab).map(item => (
                          <div 
                            key={item.id} 
                            style={{ 
                              padding: 10, 
                              borderRadius: 6, 
                              border: selectedAlertId === item.id ? '1px solid #1A5999' : '1px solid var(--color-border)',
                              backgroundColor: selectedAlertId === item.id ? 'rgba(26, 89, 153, 0.05)' : '#FFFFFF',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedAlertId(item.id)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 11 }}>
                              <span>{item.title}</span>
                              <span style={{ fontSize: 10, color: 'var(--color-text-light)' }}>{item.time}</span>
                            </div>
                            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, margin: 0 }}>{item.desc}</p>
                          </div>
                        ))}
                        {alerts.filter(a => a.tab === tab).length === 0 && (
                          <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-light)', fontSize: 11 }}>
                            Không có cảnh báo nào trong mục này
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side: Detailed View */}
                    <div>
                      {(() => {
                        const selAlert = alerts.find(a => a.id === selectedAlertId && a.tab === tab) || alerts.filter(a => a.tab === tab)[0];
                        if (!selAlert) {
                          return (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: 40, fontSize: 12 }}>
                              Chọn một cảnh báo ở danh sách bên cạnh để xem phân tích chi tiết.
                            </div>
                          );
                        }
                        return (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{
                                fontSize: 9, 
                                fontWeight: 700, 
                                textTransform: 'uppercase', 
                                padding: '2px 6px', 
                                borderRadius: 4,
                                backgroundColor: selAlert.type === 'critical' ? '#FEF2F2' : '#FEF3C7',
                                color: selAlert.type === 'critical' ? '#EF4444' : '#F59E0B'
                              }}>
                                {selAlert.type}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Thời gian: {selAlert.time} hôm nay</span>
                            </div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px 0', color: 'var(--color-text)' }}>{selAlert.title}</h4>
                            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4, backgroundColor: 'var(--color-surface-2)', padding: 10, borderRadius: 6, margin: '0 0 16px 0' }}>
                              {selAlert.details}
                            </p>
                            
                            <div style={{ display: 'flex', gap: 10 }}>
                              <button 
                                type="button" 
                                className={styles.actionBtn}
                                style={{ padding: '6px 12px', fontSize: 11, height: 'auto', backgroundColor: '#EF4444', color: '#FFFFFF', borderColor: '#EF4444' }}
                                onClick={() => {
                                  setAlerts(prev => prev.filter(a => a.id !== selAlert.id));
                                  setSelectedAlertId(null);
                                  toast(`🚫 Đã xử lý khóa tài khoản liên quan đến cảnh báo "${selAlert.title}"`, 'success');
                                }}
                              >
                                Khóa & Đóng băng
                              </button>
                              <button 
                                type="button" 
                                className={styles.actionBtn}
                                style={{ padding: '6px 12px', fontSize: 11, height: 'auto', backgroundColor: '#FFFFFF', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                onClick={() => {
                                  setAlerts(prev => prev.filter(a => a.id !== selAlert.id));
                                  setSelectedAlertId(null);
                                  toast(`✅ Đã lưu trữ và bỏ qua cảnh báo "${selAlert.title}"`, 'success');
                                }}
                              >
                                Bỏ qua & Lưu trữ
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* MOCK TABS: reports, monitoring, loans, settings, permissions, logs */}
              {!['overview', 'users', 'banks', 'transactions', 'aml', 'fraud', 'compliance'].includes(tab) && (
                <div className={styles.card}>
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                    <span style={{ fontSize: 40 }}>🛠️</span>
                    <h3 style={{ marginTop: 12, fontWeight: 700 }}>Tính năng đang phát triển</h3>
                    <p style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 4 }}>
                      Phần hành <strong>{activeTabLabel}</strong> đang được cấu hình đồng bộ hóa dữ liệu từ chi nhánh.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

        </main>
      </div>

    </div>
  );
}
