import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api, { unwrap } from '../../shared/services/api';
import { AppHeader } from '../../shared/components/Layout/AppHeader';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import { formatDate, TX_STATUS_LABELS } from '../../shared/utils/format';
import styles from './HistoryPage.module.css';

const FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'TRANSFER', label: 'Chuyển tiền' },
  { value: 'RECEIVE', label: 'Nhận tiền' },
  { value: 'PAYMENT', label: 'Thanh toán' },
];


interface ApiTransactionItem {
  _id?: string;
  reference: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
}

export function HistoryPage() {
  const [filterType, setFilterType] = useState('ALL');
  const [selected, setSelected] = useState<any | null>(null);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return styles.statusSuccess;
      case 'PENDING':
      case 'PROCESSING':
        return styles.statusFailed;
      case 'FAILED':
        return styles.statusError;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusFailed;
    }
  };

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['transactions-all'],
    queryFn: async () => {
      const res = await api.get('/transactions', {
        params: { page: 1, limit: 50 },
      });
      return unwrap<{
        items: ApiTransactionItem[];
        total: number;
      }>(res);
    },
  });

  // Map real transaction to visual card representation
  const mapRealTransaction = (tx: ApiTransactionItem) => {
    const isOut =
      tx.type === 'TRANSFER' ||
      tx.type === 'BANK_TRANSFER' ||
      tx.type === 'WITHDRAW' ||
      tx.type === 'PAYMENT';
    const amount = isOut ? -Math.abs(tx.amount) : Math.abs(tx.amount);

    let title = tx.description || 'Giao dịch';
    let icon = '💳';
    let iconBg = '#F3F4F6';
    let iconColor = '#4B5563';

    if (tx.type === 'DEPOSIT') {
      title = tx.description || 'Nạp tiền tài khoản';
      icon = '＋';
      iconBg = '#F0FFF4';
      iconColor = '#38A169';
    } else if (tx.type === 'WITHDRAW') {
      title = tx.description || 'Rút tiền tài khoản';
      icon = '🏦';
      iconBg = '#EDF2F7';
      iconColor = '#4A5568';
    } else if (tx.type === 'TRANSFER' || tx.type === 'BANK_TRANSFER' || tx.type === 'RECEIVE') {
      title = tx.description || (isOut ? 'Chuyển tiền' : 'Nhận tiền');
      icon = isOut ? '↗' : '↓';
      iconBg = isOut ? '#EBF8FF' : '#E6FFFA';
      iconColor = isOut ? '#2B6CB0' : '#319795';
    } else if (tx.type === 'PAYMENT') {
      title = tx.description || 'Thanh toán hóa đơn';
      icon = '⚡';
      iconBg = '#FFFDF5';
      iconColor = '#D69E2E';
    }

    // Specialize name pattern
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('shopee')) {
      icon = '🛒';
      iconBg = '#FFEBEA';
      iconColor = '#E53E3E';
    } else if (lowerTitle.includes('lan')) {
      icon = '↓';
      iconBg = '#E6FFFA';
      iconColor = '#319795';
    } else if (lowerTitle.includes('điện') || lowerTitle.includes('evn')) {
      icon = '⚡';
      iconBg = '#EBF8FF';
      iconColor = '#3182CE';
    } else if (lowerTitle.includes('viettel') || lowerTitle.includes('nạp đt')) {
      icon = '📱';
      iconBg = '#FFFDF5';
      iconColor = '#D69E2E';
    } else if (lowerTitle.includes('highlands') || lowerTitle.includes('coffee')) {
      icon = '☕';
      iconBg = '#FFF5F7';
      iconColor = '#D53F8C';
    }

    return {
      _id: tx._id || tx.reference,
      reference: tx.reference,
      title,
      createdAt: tx.createdAt,
      amount,
      type: tx.type,
      status: tx.status,
      icon,
      iconBg,
      iconColor,
      description: tx.description,
    };
  };

  // Compile full transactions list
  const combined = (apiData?.items ?? []).map(mapRealTransaction);

  // Sort by date descending
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter based on selected chip
  const filtered = combined.filter((tx) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'TRANSFER') {
      return tx.amount < 0 && (tx.type === 'TRANSFER' || tx.type === 'BANK_TRANSFER');
    }
    if (filterType === 'RECEIVE') {
      return tx.amount > 0 || tx.type === 'DEPOSIT';
    }
    if (filterType === 'PAYMENT') {
      return tx.type === 'PAYMENT';
    }
    return true;
  });

  // Group by Month Year
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((tx) => {
    const key = getMonthYearKey(tx.createdAt);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(tx);
  });

  function getMonthYearKey(dateStr: string) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'KHÁC';
    return `THÁNG ${d.getMonth() + 1} · ${d.getFullYear()}`;
  }

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className={styles.container}>
      <AppHeader variant="sub" title="Lịch sử giao dịch" showBack={true} />

      {/* Filter Category Tabs */}
      <div className={styles.filtersWrapper}>
        <div className={styles.filtersScroll}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${styles.chip} ${filterType === f.value ? styles.chipActive : ''}`}
              onClick={() => setFilterType(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className={styles.content}>
        {isLoading && filtered.length === 0 && (
          <div className={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonItem}>
                <div className={styles.skeletonIcon} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonLine} style={{ width: '60%' }} />
                  <div className={styles.skeletonLine} style={{ width: '40%', height: 10, marginTop: 6 }} />
                </div>
                <div className={styles.skeletonAmount} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h3 className={styles.emptyTitle}>Chưa có giao dịch</h3>
            <p className={styles.emptyHint}>Không tìm thấy giao dịch nào phù hợp với bộ lọc này.</p>
          </div>
        )}

        {/* 📱 MOBILE LIST VIEW */}
        <div className={styles.mobileList}>
          {Object.keys(grouped).map((monthKey) => (
            <div key={monthKey} className={styles.groupSection}>
              <div className={styles.groupHeader}>{monthKey}</div>
              <div className={styles.groupList}>
                {grouped[monthKey].map((tx) => (
                  <div
                    key={tx._id}
                    className={styles.txRow}
                    onClick={() => setSelected(tx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelected(tx)}
                  >
                    <div className={styles.txLeft}>
                      <div
                        className={styles.txIconBox}
                        style={{ backgroundColor: tx.iconBg, color: tx.iconColor }}
                      >
                        {tx.icon}
                      </div>
                      <div className={styles.txMeta}>
                        <h4 className={styles.txTitle}>{tx.title}</h4>
                        <span className={styles.txTime}>{formatTxDate(tx.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`${styles.txAmount} ${tx.amount > 0 ? styles.positive : styles.negative}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 💻 DESKTOP TABLE VIEW */}
        <div className={styles.desktopTableWrapper}>
          <table className={styles.desktopTable}>
            <thead>
              <tr>
                <th>NỘI DUNG</th>
                <th>NGÀY</th>
                <th>LOẠI GIAO DỊCH</th>
                <th style={{ textAlign: 'right' }}>SỐ TIỀN</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const isDeposit = tx.type === 'DEPOSIT';
                const isWithdraw = tx.type === 'WITHDRAW';
                const isTransfer = tx.type === 'TRANSFER' || tx.type === 'BANK_TRANSFER';
                const isPayment = tx.type === 'PAYMENT';

                let typeLabel = 'Giao dịch';
                if (isDeposit) typeLabel = 'Nạp tiền';
                else if (isWithdraw) typeLabel = 'Rút tiền';
                else if (isTransfer) typeLabel = tx.amount > 0 ? 'Nhận tiền' : 'Chuyển tiền';
                else if (isPayment) typeLabel = 'Thanh toán';

                return (
                  <tr key={tx._id} onClick={() => setSelected(tx)} className={styles.tableRow}>
                    <td>
                      <div className={styles.tableMerchant}>
                        <div
                          className={styles.merchantIcon}
                          style={{ backgroundColor: tx.iconBg, color: tx.iconColor }}
                        >
                          {tx.icon}
                        </div>
                        <div className={styles.merchantMeta}>
                          <span className={styles.merchantTitle}>{tx.title}</span>
                          <span className={styles.merchantSubtitle}>{tx.reference}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.tableDate}>{formatTxDate(tx.createdAt)}</span>
                    </td>
                    <td>
                      <span
                        className={styles.tableBadge}
                        style={{
                          backgroundColor: tx.amount > 0 ? '#D1FAE5' : tx.amount < 0 && !isPayment ? '#FEE2E2' : '#F5F3FF',
                          color: tx.amount > 0 ? '#065F46' : tx.amount < 0 && !isPayment ? '#991B1B' : '#7C3AED',
                        }}
                      >
                        {typeLabel}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`${styles.tableAmount} ${tx.amount > 0 ? styles.positiveText : styles.negativeText}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')} đ
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(tx.status)}`}
                      >
                        {TX_STATUS_LABELS[tx.status] || tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Chi tiết giao dịch">
        {selected && (
          <div className={styles.detail}>
            <div className={styles.detailAmountSection}>
              <div
                className={styles.detailIconCircle}
                style={{ backgroundColor: selected.iconBg, color: selected.iconColor }}
              >
                {selected.icon}
              </div>
              <div className={`${styles.detailAmount} ${selected.amount > 0 ? styles.positive : styles.negative}`}>
                {selected.amount > 0 ? '+' : ''}{selected.amount.toLocaleString('vi-VN')} đ
              </div>
              <span
                className={`${styles.detailStatusBadge} ${getStatusClass(selected.status)}`}
              >
                {TX_STATUS_LABELS[selected.status] || selected.status}
              </span>
            </div>

            <div className={styles.detailRows}>
              <div className={styles.detailRow}>
                <span>Loại giao dịch</span>
                <strong>
                  {selected.type === 'DEPOSIT'
                    ? 'Nạp tiền vào ví'
                    : selected.type === 'WITHDRAW'
                    ? 'Rút tiền ngân hàng'
                    : selected.type === 'TRANSFER' || selected.type === 'BANK_TRANSFER'
                    ? 'Chuyển tiền liên ngân hàng'
                    : 'Thanh toán dịch vụ'}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Thời gian giao dịch</span>
                <strong>{formatDate(selected.createdAt)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Mã giao dịch (Ref)</span>
                <code className={styles.detailRef}>{selected.reference}</code>
              </div>
              {selected.description && (
                <div className={styles.detailRow}>
                  <span>Nội dung</span>
                  <strong>{selected.description}</strong>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(selected.reference);
              }}
              style={{ marginTop: 16, width: '100%' } as React.CSSProperties}
            >
              📋 Sao chép mã giao dịch
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

