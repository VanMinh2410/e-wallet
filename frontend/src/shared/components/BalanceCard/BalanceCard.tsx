import { useState } from 'react';
import { IconEye, IconEyeOff } from '../ui/Icons';
import { maskBalance } from '../../utils/format';
import styles from './BalanceCard.module.css';

interface BalanceCardProps {
  balance: number;
  label?: string;
}

export function BalanceCard({ balance, label = 'Số dư ví HKi' }: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.labelRow}>
        <span>{label}</span>
        <button type="button" className={styles.eyeBtn} onClick={() => setHidden(!hidden)} aria-label="Ẩn/hiện số dư">
          {hidden ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
      <p className={styles.amount}>{maskBalance(balance, hidden)}</p>
      <p className={styles.sub}>Ví điện tử · VND</p>
    </div>
  );
}
