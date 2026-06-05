import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IconHome, IconBell, IconQr, IconUser, IconGrid } from '../ui/Icons';
import api, { unwrap } from '../../services/api';
import styles from './BottomNav.module.css';

export function BottomNav() {
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => unwrap<{ count: number }>(await api.get('/notifications/unread-count')),
    refetchInterval: 15000,
  });
  const unreadCount = unreadData?.count ?? 0;

  return (
    <nav className={styles.nav}>
      <NavLink to="/dashboard" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
        <IconHome size={22} />
        Trang chủ
      </NavLink>
      <NavLink to="/notifications" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <IconBell size={22} />
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </div>
        Thông báo
      </NavLink>
      <NavLink to="/qr-payment" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
        <IconQr size={22} />
        QR
      </NavLink>
      <NavLink to="/services" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
        <IconGrid size={22} />
        Dịch vụ
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
        <IconUser size={22} />
        Tài khoản
      </NavLink>
    </nav>
  );
}
