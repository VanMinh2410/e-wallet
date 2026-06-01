import { Link } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { IconBell, IconBack } from '../ui/Icons';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  variant?: 'home' | 'sub';
  title?: string;
  showBack?: boolean;
  backTo?: string;
}

export function AppHeader({ variant = 'home', title, showBack, backTo = '/dashboard' }: AppHeaderProps) {
  const user = useAppSelector((s) => s.auth.user);

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
            <span className={styles.badge} />
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
