import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, TX_TYPE_LABELS, TX_STATUS_LABELS } from '../../utils/format';
import styles from './TransactionList.module.css';

export interface TransactionItem {
  _id?: string;
  reference: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  TRANSFER: '↔',
  DEPOSIT: '↓',
  WITHDRAW: '↑',
  PAYMENT: '▣',
};

function typeClass(type: string) {
  const t = type.toLowerCase();
  if (t === 'transfer') return styles.transfer;
  if (t === 'deposit') return styles.deposit;
  if (t === 'withdraw') return styles.withdraw;
  if (t === 'payment') return styles.payment;
  return styles.default;
}

interface TransactionListProps {
  items: TransactionItem[];
  showViewAll?: boolean;
  onItemClick?: (tx: TransactionItem) => void;
}

export function TransactionList({ items, showViewAll = true, onItemClick }: TransactionListProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3>Giao dịch gần đây</h3>
        {showViewAll && <Link to="/transactions">Xem tất cả</Link>}
      </div>
      <ul className={styles.list}>
        {items.length === 0 && <li className={styles.empty}>Chưa có giao dịch</li>}
        {items.map((tx) => {
          const isOut = tx.type === 'TRANSFER' || tx.type === 'WITHDRAW' || tx.type === 'PAYMENT';
          return (
            <li
              key={tx._id ?? tx.reference}
              className={styles.item}
              onClick={() => onItemClick?.(tx)}
              onKeyDown={(e) => e.key === 'Enter' && onItemClick?.(tx)}
              role={onItemClick ? 'button' : undefined}
              tabIndex={onItemClick ? 0 : undefined}
            >
              <span className={`${styles.icon} ${typeClass(tx.type)}`}>
                {TYPE_ICONS[tx.type] ?? '₫'}
              </span>
              <div className={styles.info}>
                <p className={styles.title}>{TX_TYPE_LABELS[tx.type] ?? tx.type}</p>
                <p className={styles.meta}>
                  {formatDate(tx.createdAt)} · {TX_STATUS_LABELS[tx.status] ?? tx.status}
                </p>
              </div>
              <span className={`${styles.amount} ${isOut ? styles.amountOut : styles.amountIn}`}>
                {isOut ? '-' : '+'}
                {formatCurrency(tx.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
