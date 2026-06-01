import { NavLink } from 'react-router-dom';
import { IconHome, IconHistory, IconQr, IconUser, IconGrid } from '../ui/Icons';
import styles from './BottomNav.module.css';

export function BottomNav() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/dashboard" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
        <IconHome size={22} />
        Trang chủ
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
        <IconHistory size={22} />
        Lịch sử
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
