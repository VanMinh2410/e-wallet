import { Link } from 'react-router-dom';
import { IconTransfer, IconTopup, IconWithdraw, IconQr, IconHistory } from '../ui/Icons';
import styles from './QuickActions.module.css';

const actions = [
  { to: '/transfer', label: 'Chuyển tiền', icon: IconTransfer, color: 'transfer' },
  { to: '/topup', label: 'Nạp tiền', icon: IconTopup, color: 'topup' },
  { to: '/withdraw', label: 'Rút tiền', icon: IconWithdraw, color: 'withdraw' },
  { to: '/qr-payment', label: 'Quét QR', icon: IconQr, color: 'qr' },
  { to: '/transactions', label: 'Lịch sử', icon: IconHistory, color: 'history' },
  { to: '/profile', label: 'Ngân hàng', icon: IconHistory, color: 'bank' },
] as const;

export function QuickActions() {
  return (
    <div className={styles.grid}>
      {actions.map(({ to, label, icon: Icon, color }) => (
        <Link key={to + label} to={to} className={styles.item}>
          <span className={`${styles.iconWrap} ${styles[color]}`}>
            <Icon size={24} />
          </span>
          <span className={styles.label}>{label}</span>
        </Link>
      ))}
    </div>
  );
}
