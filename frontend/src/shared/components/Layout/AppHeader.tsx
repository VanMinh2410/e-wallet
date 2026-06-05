import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../../../app/hooks';
import { IconBell, IconBack } from '../ui/Icons';
import api, { unwrap } from '../../services/api';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  variant?: 'home' | 'sub';
  title?: string;
  showBack?: boolean;
  backTo?: string;
}

export function AppHeader({ variant = 'home', title, showBack, backTo = '/dashboard' }: AppHeaderProps) {
  const user = useAppSelector((s) => s.auth.user);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => unwrap<{ count: number }>(await api.get('/notifications/unread-count')),
    refetchInterval: 15000,
    enabled: !!user,
  });
  const unreadCount = unreadData?.count ?? 0;

  if (variant === 'sub') {
    return (
      <header className={styles.subHeader}>
        {showBack && (
          <Link to={backTo} className={styles.backBtn} aria-label="Quay lại">
            <IconBack />
          </Link>
        )}
        <h1>{title}</h1>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.greeting}>
          <p>Xin chào,</p>
          <h1>{user?.fullName?.split(' ').pop() ?? 'bạn'} 👋</h1>
        </div>
        <div className={styles.actions}>
          <Link to="/notifications" className={styles.iconBtn} aria-label="Thông báo">
            <IconBell size={22} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </Link>
          <Link to="/profile" className={styles.iconBtn} aria-label="Tài khoản">
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {(user?.fullName?.[0] ?? 'U').toUpperCase()}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
