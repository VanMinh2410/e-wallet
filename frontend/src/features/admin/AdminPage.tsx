import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import api, { unwrap } from '../../shared/services/api';
import { useToast } from '../../shared/context/ToastContext';
import { formatDate } from '../../shared/utils/format';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { useSocket } from '../../shared/hooks/useSocket';
import { logout } from '../auth/authSlice';
import styles from './AdminPage.module.css';

type AdminTab =
  | 'overview'
  | 'users'
  | 'transactions'
  | 'banks'
  | 'monitoring';

interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  kycStatus: string;
  transferLimit: number;
  createdAt: string;
}

interface AdminTx {
  _id: string;
  reference: string;
  type: string;
  status: string;
  amount: number;
  userId: string | { _id: string; fullName: string; email: string; phone: string };
  description?: string;
  fromWalletId?: {
    _id: string;
    userId?: { _id: string; fullName: string; email: string; phone: string };
  } | null | any;
  toWalletId?: {
    _id: string;
    userId?: { _id: string; fullName: string; email: string; phone: string };
  } | null | any;
  metadata?: {
    refunded?: boolean;
    refundedAt?: string;
    refundedBy?: string;
    originalReference?: string;
    originalTransactionId?: string;
    [key: string]: any;
  };
  bankInfo?: {
    id: string;
    bankCode: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
  } | null;
  createdAt: string;
}

interface Analytics {
  userCount: number;
  txCount: number;
  pendingWithdraw: number;
  totalDeposit: number;
  totalWithdraw: number;
  dailyRevenue?: Array<{ date: string; deposit: number; withdraw: number }>;
  hourlyTransactions?: Array<{ hour: string; val: number }>;
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

interface LoginLog {
  _id: string;
  action: string;
  resource: string;
  ip?: string;
  metadata?: {
    device?: string;
    timestamp?: string;
  };
  createdAt: string;
}

const TX_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Nạp tiền',
  WITHDRAW: 'Rút tiền',
  TRANSFER: 'Chuyển ví',
  BANK_TRANSFER: 'Chuyển NH',
  PAYMENT: 'QR Pay',
  RECEIVE: 'Nhận tiền',
  REFUND: 'Hoàn tiền',
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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const qc = useQueryClient();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      dispatch(logout());
      navigate('/login');
      toast('Đăng xuất thành công', 'info');
    }
  };

  // Socket setup for real-time transaction tracking
  useSocket(
    authUser?.id,
    {
      onTransactionCompleted: () => {
        qc.invalidateQueries({ queryKey: ['admin-transactions'] });
        qc.invalidateQueries({ queryKey: ['admin-analytics'] });
        qc.invalidateQueries({ queryKey: ['admin-pending-transactions'] });
        toast('🔔 Phát hiện giao dịch mới trên hệ thống!', 'info');
      },
    },
    authUser?.role,
  );

  // Analytics Query
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => unwrap<Analytics>(await api.get('/admin/analytics/overview')),
  });

  // Users Query
  const { data: users } = useQuery({
    queryKey: ['admin-users', userPage, userSearch],
    queryFn: async () =>
      unwrap<{ items: AdminUser[]; total: number }>(
        await api.get('/admin/users', { params: { page: userPage, limit: 10, search: userSearch || undefined } }),
      ),
    enabled: tab === 'users',
  });

  // Bank Accounts Query
  const { data: bankAccounts } = useQuery({
    queryKey: ['admin-bank-accounts', bankPage],
    queryFn: async () =>
      unwrap<{ items: AdminBankAccount[]; total: number }>(
        await api.get('/admin/bank-accounts', { params: { page: bankPage, limit: 10 } }),
      ),
    enabled: tab === 'banks',
  });

  // Transactions Query
  const { data: txs } = useQuery({
    queryKey: ['admin-transactions', txPage, txType, txStatus],
    queryFn: async () =>
      unwrap<{ items: AdminTx[]; total: number }>(
        await api.get('/admin/transactions', {
          params: { page: txPage, limit: 10, type: txType || undefined, status: txStatus || undefined },
        }),
      ),
    enabled: tab === 'transactions' || tab === 'overview',
  });

  // Pending Withdrawals Query
  const { data: pendingTxs } = useQuery({
    queryKey: ['admin-pending-transactions'],
    queryFn: async () => unwrap<AdminTx[]>(await api.get('/admin/pending-approval')),
    enabled: tab === 'monitoring',
  });

  // Login Logs for selected user
  const { data: loginLogs } = useQuery({
    queryKey: ['admin-user-login-logs', selectedUserId],
    queryFn: async () => unwrap<LoginLog[]>(await api.get(`/admin/users/${selectedUserId}/login-logs`)),
    enabled: !!selectedUserId,
  });

  const selectedUser = users?.items.find((u) => u._id === selectedUserId);

  // Action methods
  const toggleBan = async (userId: string, isActive: boolean) => {
    try {
      await api.post(`/admin/users/${userId}/${isActive ? 'ban' : 'unban'}`);
      toast(isActive ? '🚫 Đã khóa tài khoản' : '✅ Đã mở khóa tài khoản', 'success');
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

  const handleUpdateKycStatus = async (userId: string, kycStatus: string) => {
    try {
      await api.post(`/admin/users/${userId}/kyc`, { kycStatus });
      toast(`✅ Đã cập nhật trạng thái KYC thành: ${kycStatus}`, 'success');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch {
      toast('Thao tác thất bại', 'error');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await api.post(`/admin/users/${userId}/role`, { role });
      toast(`✅ Đã cập nhật quyền thành công thành: ${role}`, 'success');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch {
      toast('Thao tác thất bại', 'error');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn reset mật khẩu của người dùng này về mặc định?')) return;
    try {
      await api.post(`/admin/users/${userId}/reset-password`);
      toast('🔑 Reset mật khẩu thành công! Mật khẩu mặc định mới là: User@123456', 'success');
    } catch {
      toast('Thao tác thất bại', 'error');
    }
  };

  const handleUpdateLimit = async (userId: string, limit: number) => {
    try {
      await api.post(`/admin/users/${userId}/limit`, { limit });
      toast(`✅ Đã cập nhật hạn mức chuyển tiền thành công: ${limit.toLocaleString('vi-VN')}đ`, 'success');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch {
      toast('Thao tác thất bại', 'error');
    }
  };

  const handleRefundTransaction = async (txId: string) => {
    if (!window.confirm('Hành động này sẽ hoàn tiền lại cho người gửi và thu hồi tiền từ ví người nhận. Bạn chắc chắn muốn hoàn tiền?')) return;
    try {
      await api.post(`/admin/transactions/${txId}/refund`);
      toast('🔄 Hoàn tiền giao dịch thành công!', 'success');
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-analytics'] });
    } catch (e: any) {
      toast(e.response?.data?.message || 'Hoàn tiền thất bại', 'error');
    }
  };

  const handleApproveWithdraw = async (txId: string, approve: boolean) => {
    try {
      await api.post(`/admin/transactions/${txId}/approve`, { approve });
      toast(approve ? '✅ Đã duyệt yêu cầu rút tiền' : '❌ Đã từ chối yêu cầu rút tiền', 'success');
      qc.invalidateQueries({ queryKey: ['admin-pending-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-analytics'] });
    } catch {
      toast('Phê duyệt thất bại', 'error');
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (tab === 'users') {
      setUserSearch(val);
      setUserPage(1);
    }
  };

  const renderParties = (tx: AdminTx) => {
    const getName = (u: any) => {
      if (!u) return '';
      if (typeof u === 'object') return u.fullName || u.email || u.phone || '';
      return '';
    };

    const senderName = getName(tx.userId) || 'Hệ thống';

    if (tx.type === 'DEPOSIT') {
      const recipientName = tx.toWalletId?.userId?.fullName || getName(tx.userId) || 'Khách hàng';
      const bankMethod = tx.metadata?.paymentMethod ? tx.metadata.paymentMethod.toUpperCase() : 'Ngân hàng';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ color: '#6b7280', fontWeight: 500 }}>{bankMethod}</span>
          <span style={{ color: '#10b981', fontWeight: 900 }}>&rarr;</span>
          <span style={{ fontWeight: 700, color: '#10b981' }}>{recipientName}</span>
        </div>
      );
    }

    if (tx.type === 'WITHDRAW') {
      const senderNameVal = tx.fromWalletId?.userId?.fullName || getName(tx.userId) || 'Khách hàng';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ fontWeight: 700, color: '#ef4444' }}>{senderNameVal}</span>
          <span style={{ color: '#ef4444', fontWeight: 900 }}>&rarr;</span>
          <span style={{ color: '#6b7280', fontWeight: 500 }}>Thẻ ngân hàng</span>
        </div>
      );
    }

    if (tx.type === 'REFUND') {
      const origRecipient = tx.fromWalletId?.userId?.fullName || 'Đối tác';
      const origSender = tx.toWalletId?.userId?.fullName || getName(tx.userId) || 'Khách hàng';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ fontWeight: 600, color: '#6b7280' }}>{origRecipient}</span>
          <span style={{ color: '#d97706', fontWeight: 900 }}>&rarr;</span>
          <span style={{ fontWeight: 600, color: '#0c447c' }}>{origSender}</span>
          <span style={{ fontSize: 10, color: '#d97706', fontStyle: 'italic', marginLeft: 4 }}>(Hoàn)</span>
        </div>
      );
    }

    if (tx.type === 'BANK_TRANSFER') {
      const sName = tx.fromWalletId?.userId?.fullName || getName(tx.userId) || 'Khách hàng';
      const rName = tx.metadata?.accountName || tx.toWalletId?.userId?.fullName || 'Tài khoản nhận';
      const bankSuffix = tx.metadata?.bankCode ? ` (${tx.metadata.bankCode})` : '';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>{sName}</span>
          <span style={{ color: '#0c447c', fontWeight: 900 }}>&rarr;</span>
          <span style={{ fontWeight: 600 }}>{rName}{bankSuffix}</span>
        </div>
      );
    }

    const fromUser = tx.fromWalletId?.userId?.fullName || (tx.type === 'RECEIVE' ? 'Đối tác' : senderName);
    const toUser = tx.toWalletId?.userId?.fullName || (tx.type === 'RECEIVE' ? senderName : (tx.metadata?.recipientEmail || 'Đối tác'));

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <span style={{ fontWeight: 600 }}>{fromUser}</span>
        <span style={{ color: '#0c447c', fontWeight: 900 }}>&rarr;</span>
        <span style={{ fontWeight: 600 }}>{toUser}</span>
      </div>
    );
  };

  interface NavigationItem {
    key: AdminTab;
    label: string;
    icon: string;
  }

  interface NavigationGroup {
    title: string;
    items: NavigationItem[];
  }

  const GROUPS: NavigationGroup[] = [
    {
      title: 'TỔNG QUAN',
      items: [
        { key: 'overview', label: 'Bảng thống kê', icon: 'M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zM3 16h7v5H3v-5z' },
      ],
    },
    {
      title: 'QUẢN TRỊ VẬN HÀNH',
      items: [
        { key: 'users', label: 'Người dùng & KYC', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
        { key: 'transactions', label: 'Giám sát & Hoàn tiền', icon: 'M12 6v6l4 2 M22 12A10 10 0 1112 2M12 2v20' },
        { key: 'banks', label: 'Liên kết ngân hàng', icon: 'M2 5h20v14H2z M2 10h20' },
        { key: 'monitoring', label: 'Phê duyệt rút tiền', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      ],
    },
  ];

  const activeTabLabel = GROUPS.flatMap((g) => g.items).find((i) => i.key === tab)?.label || 'Dashboard';

  return (
    <div className={styles.adminContainer}>
      {/* ==========================================
           1. SIDEBAR (LEFT)
           ========================================== */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoIcon}>
            <RenderSvgIcon path="M5 21V10m4 11V10m6 11V10m4 11V10 M2 10l10-7 10 7 M3 21h18" />
          </div>
          <div className={styles.logoText}>
            <h1>E-Wallet</h1>
            <p>Admin Control Panel</p>
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
                  onClick={() => {
                    setTab(item.key);
                    setSearchTerm('');
                  }}
                >
                  <span className={styles.navItemContent}>
                    <RenderSvgIcon path={item.icon} className={styles.navIcon} />
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <footer className={styles.sidebarFooter}>
          <div className={styles.userAvatar}>AD</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{authUser?.fullName || 'Hệ Thống Admin'}</div>
            <div className={styles.userRole}>Root Administrator</div>
          </div>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <RenderSvgIcon
              path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9"
              className={styles.logoutIcon}
            />
          </button>
        </footer>
      </aside>

      {/* ==========================================
           2. MAIN CONTENT (RIGHT)
           ========================================== */}
      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h2 className={styles.pageTitle}>{activeTabLabel}</h2>
            {tab !== 'overview' && tab !== 'monitoring' && (
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
                  placeholder={
                    tab === 'users'
                      ? 'Tìm theo tên, email, sđt...'
                      : tab === 'banks'
                      ? 'Tìm số tài khoản, mã ngân hàng...'
                      : 'Tìm theo mã tham chiếu...'
                  }
                />
              </div>
            )}
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.statusPill}>
              <span className={styles.statusDot}></span>
              Máy chủ ổn định
            </div>
          </div>
        </header>

        <main className={styles.contentBody}>
          {/* Top statistical cards */}
          <section className={styles.metricsGrid}>
            <div className={`${styles.card} ${styles.metricCard} ${styles.gradientBlue}`}>
              <span className={styles.metricTitle}>Doanh số Nạp tiền (VND)</span>
              <div className={styles.metricValue}>
                {analytics ? analytics.totalDeposit.toLocaleString('vi-VN') : '0'}đ
              </div>
              <div className={styles.metricFooter}>
                <span>Tổng nạp hệ thống</span>
              </div>
            </div>

            <div className={`${styles.card} ${styles.metricCard} ${styles.gradientOrange}`}>
              <span className={styles.metricTitle}>Doanh số Rút tiền (VND)</span>
              <div className={styles.metricValue}>
                {analytics ? analytics.totalWithdraw.toLocaleString('vi-VN') : '0'}đ
              </div>
              <div className={styles.metricFooter}>
                <span>Tổng rút hệ thống</span>
              </div>
            </div>

            <div className={`${styles.card} ${styles.metricCard} ${styles.gradientGreen}`}>
              <span className={styles.metricTitle}>Tổng số Người dùng</span>
              <div className={styles.metricValue}>
                {analytics ? analytics.userCount.toLocaleString() : '0'}
              </div>
              <div className={styles.metricFooter}>
                <span>Khách hàng hoạt động</span>
              </div>
            </div>

            <div className={`${styles.card} ${styles.metricCard} ${styles.gradientPurple}`}>
              <span className={styles.metricTitle}>Rút tiền chờ duyệt</span>
              <div className={styles.metricValue}>
                {analytics ? analytics.pendingWithdraw.toLocaleString() : '0'}
              </div>
              <div className={styles.metricFooter}>
                <span>Yêu cầu chưa xử lý</span>
              </div>
            </div>
          </section>

          {/* MAIN TABS VIEWS */}
          {tab === 'overview' && (
            <div className={styles.dashboardLayout}>
              {/* Daily revenue comparison chart (7 days) */}
              <div className={styles.card} style={{ marginBottom: 16 }}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Doanh số Nạp & Rút tiền (7 ngày qua)</h3>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, background: 'linear-gradient(180deg, #34d399 0%, #10b981 100%)', display: 'inline-block', borderRadius: 2 }}></span>
                      Nạp tiền (Deposit)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)', display: 'inline-block', borderRadius: 2 }}></span>
                      Rút tiền (Withdraw)
                    </span>
                  </div>
                </div>
                {(() => {
                  const maxVal = Math.max(...(analytics?.dailyRevenue || []).map((d: any) => Math.max(d.deposit, d.withdraw)) || [1000000]);
                  const yLabels = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];
                  return (
                    <div style={{ display: 'flex', gap: 12, height: 240, paddingTop: 20 }}>
                      {/* Y Axis Labels */}
                      <div style={{ width: 75, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 10, color: '#9ca3af', fontWeight: 600, paddingBottom: 25 }}>
                        {yLabels.map((val, idx) => (
                          <span key={idx}>{val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val.toLocaleString()}đ</span>
                        ))}
                      </div>

                      {/* Chart Area */}
                      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Grid Lines */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                          <div style={{ borderBottom: '1px dashed #e5e7eb', width: '100%', height: 0 }}></div>
                          <div style={{ borderBottom: '1px dashed #e5e7eb', width: '100%', height: 0 }}></div>
                          <div style={{ borderBottom: '1px dashed #e5e7eb', width: '100%', height: 0 }}></div>
                          <div style={{ borderBottom: '1px dashed #e5e7eb', width: '100%', height: 0 }}></div>
                          <div style={{ borderBottom: '1px solid #cbd5e1', width: '100%', height: 0 }}></div>
                        </div>

                        {/* Bars container */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, display: 'flex', alignItems: 'flex-end', gap: 16, zIndex: 5 }}>
                          {analytics?.dailyRevenue?.map((day: any) => {
                            const depHeight = `${Math.max(4, Math.min(100, (day.deposit / (maxVal || 1)) * 100))}%`;
                            const witHeight = `${Math.max(4, Math.min(100, (day.withdraw / (maxVal || 1)) * 100))}%`;
                            return (
                              <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 6, width: '100%', height: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
                                  {/* Deposit Bar (Green) */}
                                  <div className={styles.chartBarWrapper} style={{ height: depHeight, width: 16, background: 'linear-gradient(180deg, #34d399 0%, #10b981 100%)', borderRadius: '4px 4px 0 0', position: 'relative', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.15)' }}>
                                    <div className={styles.chartTooltip}>
                                      <strong>Nạp tiền</strong><br />
                                      {day.deposit.toLocaleString('vi-VN')}đ
                                    </div>
                                  </div>
                                  {/* Withdraw Bar (Orange/Red) */}
                                  <div className={styles.chartBarWrapper} style={{ height: witHeight, width: 16, background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '4px 4px 0 0', position: 'relative', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.15)' }}>
                                    <div className={styles.chartTooltip}>
                                      <strong>Rút tiền</strong><br />
                                      {day.withdraw.toLocaleString('vi-VN')}đ
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {(!analytics?.dailyRevenue || analytics.dailyRevenue.length === 0) && (
                            <div style={{ position: 'absolute', width: '100%', textAlign: 'center', color: '#9ca3af', fontSize: 12, bottom: '50%' }}>
                              Không có dữ liệu doanh số
                            </div>
                          )}
                        </div>

                        {/* X Axis Labels */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 205, height: 20 }}>
                          {analytics?.dailyRevenue?.map((day: any) => (
                            <div key={day.date} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#4b5563', fontWeight: 700 }}>
                              {day.date.split('-').reverse().slice(0, 2).join('/')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className={styles.card} style={{ margin: 0 }}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Giao dịch phát sinh gần đây</h3>
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
                        <th>Giao dịch gửi &rarr; nhận</th>
                        <th>Loại GD</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                        <th>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs?.items.slice(0, 8).map((tx) => (
                        <tr key={tx._id}>
                          <td className={styles.colId} title={tx.reference} style={{ cursor: 'help' }}>
                            {tx.reference.length > 15 ? `${tx.reference.slice(0, 12)}...` : tx.reference}
                          </td>
                          <td>{renderParties(tx)}</td>
                          <td>
                            <span className={styles.typeBadge}>
                              {TX_TYPE_LABELS[tx.type] || tx.type}
                            </span>
                          </td>
                          <td
                            className={`${styles.colAmount} ${
                              ['DEPOSIT', 'RECEIVE', 'REFUND'].includes(tx.type)
                                ? styles.amountPositive
                                : styles.amountNegative
                            }`}
                          >
                            {['DEPOSIT', 'RECEIVE', 'REFUND'].includes(tx.type) ? '+' : '-'}
                            {tx.amount.toLocaleString('vi-VN')}đ
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${TX_STATUS_STYLE[tx.status] || ''}`}>
                              {TX_STATUS_LABELS[tx.status] || tx.status}
                            </span>
                          </td>
                          <td>{formatDate(tx.createdAt)}</td>
                        </tr>
                      ))}
                      {(!txs?.items || txs.items.length === 0) && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                            Không có giao dịch gần đây
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: users */}
          {tab === 'users' && (
            <div className={styles.card}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Quản lý người dùng & Trạng thái KYC</h3>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Vai trò</th>
                      <th>Hạn mức giao dịch</th>
                      <th>Trạng thái KYC</th>
                      <th>Tài khoản</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.items.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className={styles.userAvatarIcon}>
                              {u.fullName[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>{u.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.roleBadge}>{u.role.toUpperCase()}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            {u.transferLimit ? u.transferLimit.toLocaleString('vi-VN') : '0'}đ / ngày
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.kycBadge} ${
                              u.kycStatus === 'approved'
                                ? styles.kycApproved
                                : u.kycStatus === 'pending'
                                ? styles.kycPending
                                : u.kycStatus === 'rejected'
                                ? styles.kycRejected
                                : styles.kycNone
                            }`}
                          >
                            {u.kycStatus === 'approved'
                              ? 'Đã duyệt'
                              : u.kycStatus === 'pending'
                              ? 'Chờ duyệt'
                              : u.kycStatus === 'rejected'
                              ? 'Từ chối'
                              : 'Chưa KYC'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${u.isActive ? styles.btnDanger : styles.btnSuccess}`}
                            onClick={() => void toggleBan(u._id, u.isActive)}
                            disabled={u._id === authUser?.id}
                            style={{ padding: '4px 10px', fontSize: 11 }}
                          >
                            {u.isActive ? 'Khóa ví' : 'Mở khóa'}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.btnPrimary}`}
                            onClick={() => setSelectedUserId(u._id)}
                            style={{ padding: '4px 10px', fontSize: 11 }}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!users?.items || users.items.length === 0) && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                          Không tìm thấy người dùng phù hợp
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {users && users.total > 10 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => p - 1)}
                  >
                    ← Trước
                  </button>
                  <span className={styles.pageInfo}>
                    Trang {userPage} / {Math.ceil(users.total / 10)}
                  </span>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={users.items.length < 10}
                    onClick={() => setUserPage((p) => p + 1)}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: banks */}
          {tab === 'banks' && (
            <div className={styles.card}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Tài khoản liên kết ngân hàng</h3>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Chủ tài khoản ví</th>
                      <th>Ngân hàng</th>
                      <th>Số tài khoản</th>
                      <th>Tên trên thẻ</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankAccounts?.items
                      .filter((b) => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (
                          b.userId?.fullName?.toLowerCase().includes(term) ||
                          b.accountNumber.includes(term) ||
                          b.bankCode.toLowerCase().includes(term)
                        );
                      })
                      .map((b) => (
                        <tr key={b.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{b.userId?.fullName || 'Không tên'}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>
                              {b.userId?.email || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: '#1A5999' }}>{b.bankCode}</span>
                            <div style={{ fontSize: 10, color: '#6b7280' }}>{b.bankName}</div>
                          </td>
                          <td>
                            <code>{b.accountNumber}</code>
                          </td>
                          <td style={{ fontWeight: 600 }}>{b.accountName}</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                b.isVerified ? styles.statusSuccess : styles.statusPending
                              }`}
                            >
                              {b.isVerified ? 'Đã xác minh' : 'Chờ duyệt'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${
                                  b.isVerified ? styles.btnDanger : styles.btnSuccess
                                }`}
                                onClick={() => void toggleVerifyBank(b.id, b.isVerified)}
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                {b.isVerified ? 'Hủy XM' : 'Xác minh'}
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.btnDangerOutline}`}
                                onClick={() => void deleteBankLink(b.id)}
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                Xóa liên kết
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {(!bankAccounts?.items || bankAccounts.items.length === 0) && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                          Không tìm thấy tài khoản ngân hàng nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {bankAccounts && bankAccounts.total > 10 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={bankPage <= 1}
                    onClick={() => setBankPage((p) => p - 1)}
                  >
                    ← Trước
                  </button>
                  <span className={styles.pageInfo}>
                    Trang {bankPage} / {Math.ceil(bankAccounts.total / 10)}
                  </span>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={bankAccounts.items.length < 10}
                    onClick={() => setBankPage((p) => p + 1)}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: transactions */}
          {tab === 'transactions' && (
            <div className={styles.card}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Tra soát giao dịch hệ thống</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    className={styles.filterSelect}
                    value={txType}
                    onChange={(e) => {
                      setTxType(e.target.value);
                      setTxPage(1);
                    }}
                  >
                    <option value="">Tất cả loại GD</option>
                    <option value="DEPOSIT">Nạp tiền</option>
                    <option value="WITHDRAW">Rút tiền</option>
                    <option value="TRANSFER">Chuyển ví</option>
                    <option value="BANK_TRANSFER">Chuyển NH</option>
                    <option value="PAYMENT">QR Pay</option>
                    <option value="RECEIVE">Nhận tiền</option>
                    <option value="REFUND">Hoàn tiền</option>
                  </select>
                  <select
                    className={styles.filterSelect}
                    value={txStatus}
                    onChange={(e) => {
                      setTxStatus(e.target.value);
                      setTxPage(1);
                    }}
                  >
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
                      <th>Mã tham chiếu</th>
                      <th>Người gửi &rarr; Người nhận</th>
                      <th>Loại</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Mô tả</th>
                      <th>Thời gian</th>
                      <th>Tra soát</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs?.items
                      .filter((tx) => {
                        if (!searchTerm) return true;
                        return tx.reference.toLowerCase().includes(searchTerm.toLowerCase());
                      })
                      .map((tx) => (
                        <tr key={tx._id}>
                          <td className={styles.colId} title={tx.reference} style={{ cursor: 'help' }}>
                            {tx.reference.length > 15 ? `${tx.reference.slice(0, 12)}...` : tx.reference}
                          </td>
                          <td>{renderParties(tx)}</td>
                          <td>
                            <span className={styles.typeBadge}>
                              {TX_TYPE_LABELS[tx.type] || tx.type}
                            </span>
                          </td>
                          <td
                            className={`${styles.colAmount} ${
                              ['DEPOSIT', 'RECEIVE', 'REFUND'].includes(tx.type)
                                ? styles.amountPositive
                                : styles.amountNegative
                            }`}
                          >
                            {['DEPOSIT', 'RECEIVE', 'REFUND'].includes(tx.type) ? '+' : '-'}
                            {tx.amount.toLocaleString('vi-VN')}đ
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${TX_STATUS_STYLE[tx.status] || ''}`}>
                              {TX_STATUS_LABELS[tx.status] || tx.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tx.description || 'Không có mô tả'}
                            </div>
                          </td>
                          <td>{formatDate(tx.createdAt)}</td>
                          <td>
                            {tx.status === 'SUCCESS' &&
                              ['TRANSFER', 'BANK_TRANSFER', 'PAYMENT', 'RECEIVE'].includes(tx.type) &&
                              tx.fromWalletId &&
                              tx.toWalletId &&
                              !tx.metadata?.refunded && (
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.btnWarning}`}
                                  onClick={() => void handleRefundTransaction(tx._id)}
                                  style={{ padding: '3px 8px', fontSize: 10 }}
                                >
                                  Hoàn tiền
                                </button>
                              )}
                            {tx.metadata?.refunded && (
                              <span style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
                                Đã hoàn trả
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    {(!txs?.items || txs.items.length === 0) && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                          Không tìm thấy giao dịch nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {txs && txs.total > 10 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={txPage <= 1}
                    onClick={() => setTxPage((p) => p - 1)}
                  >
                    ← Trước
                  </button>
                  <span className={styles.pageInfo}>
                    Trang {txPage} / {Math.ceil(txs.total / 10)}
                  </span>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={txs.items.length < 10}
                    onClick={() => setTxPage((p) => p + 1)}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: monitoring (Pending Withdrawal Approval) */}
          {tab === 'monitoring' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Hourly Load frequency chart */}
              <div className={styles.card}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Tần suất giao dịch phát sinh theo giờ (Hôm nay)</h3>
                  <span style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600 }}>
                    Hệ thống giám sát tải thực tế
                  </span>
                </div>
                {(() => {
                  const maxCount = Math.max(...(analytics?.hourlyTransactions || []).map((h: any) => h.val) || [10]);
                  const yLabelsHours = [maxCount, Math.round(maxCount * 0.5), 0];
                  return (
                    <div style={{ display: 'flex', gap: 10, height: 160, paddingTop: 10 }}>
                      {/* Y Axis Labels */}
                      <div style={{ width: 45, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 9, color: '#9ca3af', fontWeight: 600, paddingBottom: 20 }}>
                        {yLabelsHours.map((val, idx) => (
                          <span key={idx}>{val} GD</span>
                        ))}
                      </div>

                      {/* Chart Area */}
                      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Grid Lines */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 130, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                          <div style={{ borderBottom: '1px dashed #e5e7eb', width: '100%', height: 0 }}></div>
                          <div style={{ borderBottom: '1px dashed #e5e7eb', width: '100%', height: 0 }}></div>
                          <div style={{ borderBottom: '1px solid #cbd5e1', width: '100%', height: 0 }}></div>
                        </div>

                        {/* Bars container */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 130, display: 'flex', alignItems: 'flex-end', gap: 6, zIndex: 5 }}>
                          {analytics?.hourlyTransactions?.map((item: any) => {
                            const barHeight = `${Math.max(4, Math.min(100, (item.val / (maxCount || 1)) * 100))}%`;
                            return (
                              <div key={item.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                  <div className={styles.chartBarWrapper} style={{ height: barHeight, width: '80%', background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)', borderRadius: '2px 2px 0 0', position: 'relative', boxShadow: '0 1px 3px rgba(59, 130, 246, 0.15)' }}>
                                    <div className={styles.chartTooltip}>{item.hour}: {item.val} GD</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* X Axis Labels */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 135, height: 20 }}>
                          {analytics?.hourlyTransactions?.map((item: any) => (
                            <div key={item.hour} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: '#6b7280', fontWeight: 600 }}>
                              {parseInt(item.hour)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Pending Withdrawal requests list */}
              <div className={styles.card}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Yêu cầu rút tiền đang chờ duyệt</h3>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Mã giao dịch</th>
                        <th>Khách hàng</th>
                        <th>Số tiền rút</th>
                        <th>Ngân hàng nhận</th>
                        <th>Thời gian yêu cầu</th>
                        <th>Phê duyệt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTxs?.map((tx) => (
                        <tr key={tx._id}>
                          <td className={styles.colId}>{tx.reference}</td>
                          <td style={{ fontWeight: 600 }}>
                            {typeof tx.userId === 'object' && tx.userId ? tx.userId.fullName : tx.userId}
                            {typeof tx.userId === 'object' && tx.userId && (
                              <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 400, marginTop: 2 }}>
                                {tx.userId.phone}
                              </div>
                            )}
                          </td>
                          <td className={styles.amountNegative} style={{ fontWeight: 700 }}>
                            -{tx.amount.toLocaleString('vi-VN')}đ
                          </td>
                          <td>
                            {tx.bankInfo ? (
                              <div>
                                <span style={{ fontWeight: 700, color: '#0c447c' }}>{tx.bankInfo.bankCode}</span>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginTop: 2 }}>
                                  {tx.bankInfo.accountName}
                                </div>
                                <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'monospace' }}>
                                  {tx.bankInfo.accountNumber}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, fontStyle: 'italic', color: '#9ca3af' }}>
                                Ví nguồn: {typeof tx.userId === 'object' && tx.userId ? tx.userId.email : 'N/A'}
                              </span>
                            )}
                          </td>
                          <td>{formatDate(tx.createdAt)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.btnSuccess}`}
                                onClick={() => void handleApproveWithdraw(tx._id, true)}
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.btnDanger}`}
                                onClick={() => void handleApproveWithdraw(tx._id, false)}
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!pendingTxs || pendingTxs.length === 0) && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                            Không có yêu cầu rút tiền nào đang chờ duyệt
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==========================================
           3. USER DETAIL MODAL
           ========================================== */}
      {selectedUserId && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setSelectedUserId(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h3>Chi tiết người dùng: {selectedUser.fullName}</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedUserId(null)}>
                &times;
              </button>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                {/* Basic user info */}
                <div>
                  <h4 className={styles.sectionTitle}>Thông tin cá nhân</h4>
                  <ul className={styles.infoList}>
                    <li>
                      <strong>Họ và tên:</strong> {selectedUser.fullName}
                    </li>
                    <li>
                      <strong>Email:</strong> {selectedUser.email}
                    </li>
                    <li>
                      <strong>Số điện thoại:</strong> {selectedUser.phone}
                    </li>
                    <li>
                      <strong>Vai trò hiện tại:</strong>{' '}
                      <span className={styles.roleBadge}>{selectedUser.role.toUpperCase()}</span>
                    </li>
                    <li>
                      <strong>Ngày đăng ký:</strong> {formatDate(selectedUser.createdAt)}
                    </li>
                  </ul>
                </div>

                {/* Operations & actions */}
                <div>
                  <h4 className={styles.sectionTitle}>Cấu hình tài khoản</h4>

                  {/* KYC Toggle */}
                  <div className={styles.operationRow}>
                    <label>Trạng thái KYC:</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${
                          selectedUser.kycStatus === 'approved' ? styles.btnSuccess : styles.btnSuccessOutline
                        }`}
                        onClick={() => void handleUpdateKycStatus(selectedUser._id, 'approved')}
                        style={{ padding: '4px 8px', fontSize: 11 }}
                      >
                        Phê duyệt
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${
                          selectedUser.kycStatus === 'rejected' ? styles.btnDanger : styles.btnDangerOutline
                        }`}
                        onClick={() => void handleUpdateKycStatus(selectedUser._id, 'rejected')}
                        style={{ padding: '4px 8px', fontSize: 11 }}
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>

                  {/* Role Change */}
                  <div className={styles.operationRow}>
                    <label>Quyền tài khoản:</label>
                    <select
                      className={styles.modalSelect}
                      value={selectedUser.role}
                      disabled={selectedUser._id === authUser?.id}
                      onChange={(e) => void handleUpdateRole(selectedUser._id, e.target.value)}
                    >
                      <option value="user">User (Khách hàng)</option>
                      <option value="admin">Admin (Quản trị viên)</option>
                    </select>
                  </div>

                  {/* Limit Set */}
                  <div className={styles.operationRow} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label>Hạn mức chuyển khoản / ngày:</label>
                      <span style={{ fontWeight: 600, color: '#0c447c' }}>
                        {selectedUser.transferLimit ? selectedUser.transferLimit.toLocaleString('vi-VN') : '0'}đ
                      </span>
                    </div>
                    <div className={styles.limitPresets}>
                      {[5000000, 10000000, 50000000, 100000000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className={styles.presetBtn}
                          onClick={() => void handleUpdateLimit(selectedUser._id, preset)}
                        >
                          {(preset / 1000000).toFixed(0)}M
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Password */}
                  <div className={styles.operationRow}>
                    <label>Mật khẩu:</label>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.btnWarning}`}
                      onClick={() => void handleResetPassword(selectedUser._id)}
                      style={{ padding: '5px 12px', fontSize: 11 }}
                    >
                      Reset mật khẩu mặc định
                    </button>
                  </div>
                </div>
              </div>

              {/* Login Log Details */}
              <div style={{ marginTop: 20 }}>
                <h4 className={styles.sectionTitle}>Lịch sử đăng nhập & Thiết bị</h4>
                <div className={styles.logsTableWrapper}>
                  <table className={styles.table} style={{ fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Địa chỉ IP</th>
                        <th>Chi tiết thiết bị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginLogs?.map((log) => (
                        <tr key={log._id}>
                          <td>{formatDate(log.createdAt)}</td>
                          <td><code>{log.ip || '127.0.0.1'}</code></td>
                          <td>{log.metadata?.device || 'Chrome Browser (Windows)'}</td>
                        </tr>
                      ))}
                      {(!loginLogs || loginLogs.length === 0) && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: 12, color: '#9ca3af' }}>
                            Chưa ghi nhận lịch sử đăng nhập nào
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
