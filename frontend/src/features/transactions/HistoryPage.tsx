import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import api, { unwrap } from '../../shared/services/api';
import { AppHeader } from '../../shared/components/Layout/AppHeader';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import { formatDate, TX_STATUS_LABELS } from '../../shared/utils/format';
import styles from './HistoryPage.module.css';

const FILTERS = [
  { value: 'ALL', label: '✦ Tất cả' },
  { value: 'TRANSFER', label: '↗ Chuyển tiền' },
  { value: 'RECEIVE', label: '↓ Nhận tiền' },
  { value: 'PAYMENT', label: '⚡ Thanh toán' },
];

const VIEWED_KEY = 'tx_viewed_ids';

function getViewedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markViewed(id: string) {
  const set = getViewedIds();
  set.add(id);
  try {
    localStorage.setItem(VIEWED_KEY, JSON.stringify([...set]));
  } catch {
    // ignore storage errors
  }
}

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
  const qc = useQueryClient();

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'SUCCESS':    return styles.statusSuccess;
      case 'PENDING':
      case 'PROCESSING': return styles.statusFailed;
      case 'FAILED':     return styles.statusError;
      case 'CANCELLED':  return styles.statusCancelled;
      default:           return styles.statusFailed;
    }
  };

  const getStatusClassMobile = (status: string) => {
    switch (status) {
      case 'SUCCESS':    return styles.mobileSuccess;
      case 'PENDING':
      case 'PROCESSING': return styles.mobilePending;
      case 'FAILED':     return styles.mobileFailed;
      case 'CANCELLED':  return styles.mobileCancelled;
      default:           return styles.mobilePending;
    }
  };

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['transactions-all'],
    queryFn: async () => {
      const res = await api.get('/transactions', {
        params: { page: 1, limit: 50 },
      });
      return unwrap<{ items: ApiTransactionItem[]; total: number }>(res);
    },
  });

  // When a transaction is opened, mark it as viewed and invalidate the badge query
  const handleSelectTx = useCallback((tx: any) => {
    setSelected(tx);
    const id: string = tx._id || tx.reference;
    const viewedBefore = getViewedIds().has(id);
    if (!viewedBefore) {
      markViewed(id);
      // Invalidate the layout badge query so it recalculates unread count
      qc.invalidateQueries({ queryKey: ['layout-transactions-count'] });
    }
  }, [qc]);

  const mapRealTransaction = (tx: ApiTransactionItem) => {
    const isOut =
      tx.type === 'TRANSFER' ||
      tx.type === 'BANK_TRANSFER' ||
      tx.type === 'WITHDRAW' ||
      tx.type === 'PAYMENT';
    const amount = isOut ? -Math.abs(tx.amount) : Math.abs(tx.amount);

    let title = tx.description || 'Giao dịch';
    let icon = '💳';
    let iconBg = '#F1F5F9';
    let iconColor = '#64748B';

    if (tx.type === 'DEPOSIT') {
      title = tx.description || 'Nạp tiền vào ví';
      icon = '＋';
      iconBg = '#ECFDF5';
      iconColor = '#059669';
    } else if (tx.type === 'WITHDRAW') {
      title = tx.description || 'Rút tiền ngân hàng';
      icon = '🏦';
      iconBg = '#F1F5F9';
      iconColor = '#475569';
    } else if (tx.type === 'TRANSFER' || tx.type === 'BANK_TRANSFER' || tx.type === 'RECEIVE') {
      title = tx.description || (isOut ? 'Chuyển tiền' : 'Nhận tiền');
      icon = isOut ? '↗' : '↓';
      iconBg = isOut ? '#EFF6FF' : '#F0FDFA';
      iconColor = isOut ? '#2563EB' : '#0D9488';
    } else if (tx.type === 'PAYMENT') {
      title = tx.description || 'Thanh toán dịch vụ';
      icon = '⚡';
      iconBg = '#FFFBEB';
      iconColor = '#D97706';
    }

    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('shopee')) {
      icon = '🛒'; iconBg = '#FEF2F2'; iconColor = '#DC2626';
    } else if (lowerTitle.includes('điện') || lowerTitle.includes('evn')) {
      icon = '⚡'; iconBg = '#EFF6FF'; iconColor = '#2563EB';
    } else if (lowerTitle.includes('viettel') || lowerTitle.includes('nạp đt')) {
      icon = '📱'; iconBg = '#FFFBEB'; iconColor = '#D97706';
    } else if (lowerTitle.includes('highlands') || lowerTitle.includes('coffee')) {
      icon = '☕'; iconBg = '#FDF4FF'; iconColor = '#9333EA';
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

  const combined = (apiData?.items ?? []).map(mapRealTransaction);
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = combined.filter((tx) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'TRANSFER') return tx.amount < 0 && (tx.type === 'TRANSFER' || tx.type === 'BANK_TRANSFER');
    if (filterType === 'RECEIVE') return tx.amount > 0 || tx.type === 'DEPOSIT';
    if (filterType === 'PAYMENT') return tx.type === 'PAYMENT';
    return true;
  });

  // Stats
  const totalIn  = combined.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = combined.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const txCount  = combined.length;

  const formatShort = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString('vi-VN');
  };

  // Group by Month Year
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((tx) => {
    const key = getMonthYearKey(tx.createdAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  function getMonthYearKey(dateStr: string) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'KHÁC';
    return `Tháng ${d.getMonth() + 1} · ${d.getFullYear()}`;
  }

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className={styles.container}>
      <AppHeader variant="sub" title="Lịch sử giao dịch" showBack={true} />

      {/* ── Hero Stats ── */}
      <div className={styles.heroStats}>
        <div className={styles.heroTitle}>Tổng quan tháng này</div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>↓</span>
            <span className={styles.statValue}>+{formatShort(totalIn)}đ</span>
            <span className={styles.statLabel}>Nhận về</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>↗</span>
            <span className={styles.statValue}>-{formatShort(totalOut)}đ</span>
            <span className={styles.statLabel}>Chi tiêu</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📋</span>
            <span className={styles.statValue}>{txCount}</span>
            <span className={styles.statLabel}>Giao dịch</span>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
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

      {/* ── Content ── */}
      <div className={styles.content}>
        {isLoading && filtered.length === 0 && (
          <div className={styles.skeletonList}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeletonItem}>
                <div className={styles.skeletonIcon} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonLine} style={{ width: '55%' }} />
                  <div className={styles.skeletonLine} style={{ width: '35%', height: 10, marginTop: 8 }} />
                </div>
                <div className={styles.skeletonAmount} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <span>📭</span>
            </div>
            <h3 className={styles.emptyTitle}>Chưa có giao dịch</h3>
            <p className={styles.emptyHint}>Không tìm thấy giao dịch nào phù hợp với bộ lọc đã chọn.</p>
          </div>
        )}

        {/* 📱 MOBILE LIST */}
        <div className={styles.mobileList}>
          {Object.keys(grouped).map((monthKey) => (
            <div key={monthKey} className={styles.groupSection}>
              <div className={styles.groupHeader}>{monthKey}</div>
              <div className={styles.groupList}>
                {grouped[monthKey].map((tx, idx) => (
                  <div
                    key={tx._id}
                    className={styles.txRow}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    onClick={() => handleSelectTx(tx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectTx(tx)}
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
                    <div className={styles.txRight}>
                      <span className={`${styles.txAmount} ${tx.amount > 0 ? styles.positive : styles.negative}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                      </span>
                      <span className={`${styles.txStatusBadgeMobile} ${getStatusClassMobile(tx.status)}`}>
                        {TX_STATUS_LABELS[tx.status] || tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 💻 DESKTOP TABLE — only render when there are transactions */}
        {filtered.length > 0 && (
          <div className={styles.desktopTableWrapper}>
            <table className={styles.desktopTable}>
              <thead>
                <tr>
                  <th>Nội dung</th>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const isDeposit  = tx.type === 'DEPOSIT';
                  const isWithdraw = tx.type === 'WITHDRAW';
                  const isTransfer = tx.type === 'TRANSFER' || tx.type === 'BANK_TRANSFER';
                  const isPayment  = tx.type === 'PAYMENT';

                  let typeLabel = 'Giao dịch';
                  if (isDeposit)       typeLabel = 'Nạp tiền';
                  else if (isWithdraw) typeLabel = 'Rút tiền';
                  else if (isTransfer) typeLabel = tx.amount > 0 ? 'Nhận tiền' : 'Chuyển tiền';
                  else if (isPayment)  typeLabel = 'Thanh toán';

                  const badgeBg = tx.amount > 0
                    ? '#D1FAE5'
                    : tx.amount < 0 && !isPayment
                    ? '#FEE2E2'
                    : '#F5F3FF';

                  const badgeColor = tx.amount > 0
                    ? '#065F46'
                    : tx.amount < 0 && !isPayment
                    ? '#991B1B'
                    : '#6D28D9';

                  return (
                    <tr key={tx._id} onClick={() => handleSelectTx(tx)} className={styles.tableRow}>
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
                          style={{ backgroundColor: badgeBg, color: badgeColor }}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`${styles.tableAmount} ${tx.amount > 0 ? styles.positiveText : styles.negativeText}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(tx.status)}`}>
                          {TX_STATUS_LABELS[tx.status] || tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
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
              <div className={styles.detailAmount}>
                {selected.amount > 0 ? '+' : ''}{selected.amount.toLocaleString('vi-VN')} đ
              </div>
              <span className={`${styles.detailStatusBadge} ${getStatusClass(selected.status)}`}>
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
                    ? 'Chuyển tiền ngân hàng'
                    : 'Thanh toán dịch vụ'}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Thời gian</span>
                <strong>{formatDate(selected.createdAt)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Mã tham chiếu</span>
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
              onClick={() => { void navigator.clipboard.writeText(selected.reference); }}
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
