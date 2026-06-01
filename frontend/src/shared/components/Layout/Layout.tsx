import { Outlet, useLocation, useNavigate, NavLink, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { logout } from '../../../features/auth/authSlice';
import api, { unwrap } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { BottomNav } from './BottomNav';
import styles from './Layout.module.css';

const HIDE_NAV_PATHS = ['/transfer', '/topup', '/withdraw'];

export function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);

  const { data: txData } = useQuery({
    queryKey: ['layout-transactions-count'],
    queryFn: async () => {
      const res = await api.get('/transactions', { params: { page: 1, limit: 1 } });
      return unwrap<{ total: number }>(res);
    },
    enabled: !!user,
  });

  const txCount = txData?.total ?? 0;

  const hideNav = HIDE_NAV_PATHS.some((p) => pathname.startsWith(p));

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      dispatch(logout());
      navigate('/login');
      toast('Đăng xuất thành công', 'info');
    }
  };

  // Determine current page title for Topbar
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/transactions')) return 'Lịch sử giao dịch';
    if (pathname.startsWith('/transfer')) return 'Chuyển tiền';
    if (pathname.startsWith('/topup')) return 'Nạp tiền';
    if (pathname.startsWith('/qr-payment')) return 'QR Thanh toán';
    if (pathname.startsWith('/services')) return 'Thanh toán dịch vụ';
    if (pathname.startsWith('/profile')) return 'Cài đặt tài khoản';
    if (pathname.startsWith('/withdraw')) return 'Rút tiền';
    return 'VBank';
  };

  return (
    <div className={`${styles.shell} ${hideNav ? styles.hideNav : ''}`}>
      {/* 💻 DESKTOP LEFT SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logoText}>VBANK</h1>
          <span className={styles.logoSubtitle}>INTERNET BANKING</span>
        </div>

        {/* User profile badge */}
        <div className={styles.profileBadge}>
          <div className={styles.avatar}>
            {(user?.fullName?.[0] ?? 'V').toUpperCase()}
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{user?.fullName || 'Nguyễn Văn An'}</span>
            <span className={styles.profileId}>ID - 2024-004821</span>
          </div>
        </div>

        {/* Navigation list grouped */}
        <nav className={styles.menuList}>
          <div className={styles.menuGroup}>
            <span className={styles.groupTitle}>TỔNG QUAN</span>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
            >
              <svg className={styles.menuIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Dashboard
            </NavLink>
            <NavLink
              to="/transactions"
              className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
            >
              <svg className={styles.menuIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Lịch sử
              {txCount > 0 && <span className={styles.badgeCount}>{txCount}</span>}
            </NavLink>
          </div>

          <div className={styles.menuGroup}>
            <span className={styles.groupTitle}>GIAO DỊCH</span>
            <NavLink
              to="/transfer"
              className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
            >
              <svg className={styles.menuIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="17" y1="17" x2="7" y2="7" />
                <polyline points="7 17 7 7 17 7" />
                <line x1="7" y1="7" x2="17" y2="17" />
                <polyline points="17 7 17 17 7 17" />
              </svg>
              Chuyển tiền
            </NavLink>
            <NavLink
              to="/topup"
              className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
            >
              <svg className={styles.menuIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Nạp tiền
            </NavLink>
            <NavLink
              to="/qr-payment"
              className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
            >
              <svg className={styles.menuIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              QR Thanh toán
            </NavLink>
            <NavLink
              to="/services"
              className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
            >
              <svg className={styles.menuIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Dịch vụ
            </NavLink>
          </div>

          <div className={styles.menuGroup}>
            <span className={styles.groupTitle}>TÀI CHÍNH</span>
            <NavLink
              to="/investments"
              onClick={(e) => { e.preventDefault(); toast('Tính năng Đầu tư đang được phát triển', 'info'); }}
              className={styles.menuItem}
            >
              <svg className={styles.menuIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Đầu tư
            </NavLink>
            <NavLink
              to="/loans"
              onClick={(e) => { e.preventDefault(); toast('Tính năng Vay vốn đang được phát triển', 'info'); }}
              className={styles.menuItem}
            >
              <svg className={styles.menuIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 22v-6a9 9 0 0 1 18 0v6" />
                <path d="M22 22H2" />
              </svg>
              Vay vốn
            </NavLink>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <Link to="/profile" className={styles.sidebarFooterItem}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Cài đặt
          </Link>
          <button type="button" onClick={handleLogout} className={styles.sidebarFooterItemBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* 💻 DESKTOP CONTAINER PANEL */}
      <div className={styles.mainContainer}>
        {/* 💻 DESKTOP TOPBAR */}
        <header className={styles.topbar}>
          <h2 className={styles.topbarTitle}>{getPageTitle()}</h2>
          
          {/* Centered Search Bar */}
          <div className={styles.searchBar}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} />
          </div>

          {/* Right Action Circle Buttons */}
          <div className={styles.topbarActions}>
            <button type="button" className={styles.circleBtn} onClick={() => toast('Tính năng phân tích đang được cập nhật', 'info')} aria-label="Phân tích">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
            <button type="button" className={styles.circleBtn} onClick={() => navigate('/transactions')} aria-label="Làm mới">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
            <button type="button" className={styles.circleBtn} onClick={() => navigate('/profile')} aria-label="Cài đặt">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>

        {/* 💻 MAIN CONTENT SCROLL AREA */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      {/* 📱 MOBILE BOTTOM NAVIGATION */}
      {!hideNav && <BottomNav />}
    </div>
  );
}
