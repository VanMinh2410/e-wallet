import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import api, { unwrap } from '../../shared/services/api';
import { useSocket } from '../../shared/hooks/useSocket';
import { useToast } from '../../shared/context/ToastContext';
import styles from './DashboardPage.module.css';

interface LinkedBankAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountNumberMasked: string;
  isVerified: boolean;
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

export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [balance, setBalance] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [showCardNumbers, setShowCardNumbers] = useState<Record<string, boolean>>({});

  const toggleCardVisibility = (id: string) => {
    setShowCardNumbers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => unwrap<{ id: string; balance: number }>(await api.get('/wallets')),
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ['user-bank-accounts'],
    queryFn: async () => unwrap<LinkedBankAccount[]>(await api.get('/bank-accounts')),
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => unwrap<{ count: number }>(await api.get('/notifications/unread-count')),
    refetchInterval: 15000,
  });
  const unreadCount = unreadData?.count ?? 0;

  const { data: transactionsData } = useQuery({
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

  useSocket(user?.id, {
    onBalanceUpdated: (b) => {
      setBalance(b);
      // Optional: don't toast balance update in dashboard to avoid spam
    },
    onTransactionCompleted: () => {
      qc.invalidateQueries({ queryKey: ['transactions-all'] });
    },
    onNotification: (n) => {
      const note = n as { title?: string; message?: string };
      toast(note.message ?? note.title ?? 'Có thông báo mới', 'info');
      qc.invalidateQueries({ queryKey: ['transactions-all'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const displayBalance = balance ?? wallet?.balance ?? 0;

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Map real transaction to visual representation
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
      id: tx._id || tx.reference,
      title,
      subtitle: tx.type === 'DEPOSIT' ? 'Nạp tiền vào ví' : tx.type === 'WITHDRAW' ? 'Rút tiền ngân hàng' : 'Giao dịch',
      time: formatTxDate(tx.createdAt),
      amount,
      type: tx.type,
      badge: isOut ? 'Chi' : 'Thu',
      icon,
      bgColor: iconBg,
      color: iconColor,
    };
  };

  const recentTxs = (transactionsData?.items ?? [])
    .slice(0, 5)
    .map(mapRealTransaction);

  // Dynamic monthly income/expenses calculation
  const getMonthlyStats = () => {
    let income = 0;
    let expense = 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const allTx = transactionsData?.items || [];
    allTx.forEach((tx) => {
      // Only count success transactions
      if (tx.status !== 'SUCCESS') return;

      const txDate = new Date(tx.createdAt);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        const isOut =
          tx.type === 'TRANSFER' ||
          tx.type === 'BANK_TRANSFER' ||
          tx.type === 'WITHDRAW' ||
          tx.type === 'PAYMENT';
        if (isOut) {
          expense += tx.amount;
        } else {
          income += tx.amount;
        }
      }
    });
    return { income, expense };
  };

  const { income: totalIncomeThisMonth, expense: totalExpenseThisMonth } = getMonthlyStats();

  const getChartData = () => {
    interface ChartMonth {
      month: string;
      year: number;
      monthNum: number;
      rawThu: number;
      rawChi: number;
    }
    const months: ChartMonth[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: `Th.${d.getMonth() + 1}`,
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        rawThu: 0,
        rawChi: 0,
      });
    }

    const allTx = transactionsData?.items || [];
    allTx.forEach((tx) => {
      if (tx.status !== 'SUCCESS') return;
      const txDate = new Date(tx.createdAt);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();
      const isOut =
        tx.type === 'TRANSFER' ||
        tx.type === 'BANK_TRANSFER' ||
        tx.type === 'WITHDRAW' ||
        tx.type === 'PAYMENT';

      const match = months.find((m) => m.year === txYear && m.monthNum === txMonth);
      if (match) {
        if (isOut) {
          match.rawChi += tx.amount;
        } else {
          match.rawThu += tx.amount;
        }
      }
    });

    let maxVal = 100000;
    months.forEach((m) => {
      if (m.rawThu > maxVal) maxVal = m.rawThu;
      if (m.rawChi > maxVal) maxVal = m.rawChi;
    });

    return months.map((m) => ({
      month: m.month,
      thu: m.rawThu === 0 ? 0 : (m.rawThu / maxVal) * 90 + 10,
      chi: m.rawChi === 0 ? 0 : (m.rawChi / maxVal) * 90 + 10,
    }));
  };

  const chartData = getChartData();

  const getCategoryExpenses = () => {
    const categories: Record<string, { amount: number; barColor: string }> = {
      'Ăn uống': { amount: 0, barColor: '#F97316' },
      'Hóa đơn': { amount: 0, barColor: '#3B82F6' },
      'Mua sắm': { amount: 0, barColor: '#EC4899' },
      'Giải trí': { amount: 0, barColor: '#A855F7' },
      'Khác': { amount: 0, barColor: '#64748B' },
    };

    const allTx = transactionsData?.items || [];
    let totalPayments = 0;

    allTx.forEach((tx) => {
      if (tx.status !== 'SUCCESS') return;
      if (tx.type === 'PAYMENT') {
        totalPayments += tx.amount;
        const desc = (tx.description || '').toLowerCase();
        if (
          desc.includes('ăn') ||
          desc.includes('food') ||
          desc.includes('uống') ||
          desc.includes('coffee') ||
          desc.includes('cà phê')
        ) {
          categories['Ăn uống'].amount += tx.amount;
        } else if (
          desc.includes('điện') ||
          desc.includes('nước') ||
          desc.includes('internet') ||
          desc.includes('evn') ||
          desc.includes('hóa đơn')
        ) {
          categories['Hóa đơn'].amount += tx.amount;
        } else if (
          desc.includes('shopee') ||
          desc.includes('mua sắm') ||
          desc.includes('lazada') ||
          desc.includes('tiki') ||
          desc.includes('shop')
        ) {
          categories['Mua sắm'].amount += tx.amount;
        } else if (
          desc.includes('phim') ||
          desc.includes('vé') ||
          desc.includes('game') ||
          desc.includes('chơi') ||
          desc.includes('giải trí')
        ) {
          categories['Giải trí'].amount += tx.amount;
        } else {
          categories['Khác'].amount += tx.amount;
        }
      }
    });

    return Object.keys(categories)
      .map((label) => {
        const cat = categories[label];
        const percent = totalPayments > 0 ? Math.round((cat.amount / totalPayments) * 100) : 0;
        return {
          label,
          amount: cat.amount,
          percent,
          barColor: cat.barColor,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  };

  const categoryExpenses = getCategoryExpenses();

  const currentMonthNum = new Date().getMonth() + 1;

  return (
    <div className={styles.dashboardContainer}>
      
      {/* =================== 📱 MOBILE VIEW WRAPPER =================== */}
      <div className={styles.mobileView}>
        {/* 🔵 BLUE GRADIENT HEADER SHAPE */}
        <header className={styles.brandHeader}>
          <div className={styles.topHeaderRow}>
            <div className={styles.userGreeting}>
              <span className={styles.greetingText}>Chào buổi sáng 👋</span>
              <h2 className={styles.userName}>{user?.fullName || 'Nguyễn Văn An'}</h2>
            </div>
            <button
              type="button"
              className={styles.notificationBell}
              onClick={() => navigate('/notifications')}
              aria-label="Thông báo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount}</span>}
            </button>
          </div>

          {/* 💳 BALANCE FLOATING CARD */}
          <div className={styles.balanceCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span className={styles.balanceLabel}>Số dư khả dụng</span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                aria-label="Ẩn/hiển thị số dư"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '-4px'
                }}
              >
                {showBalance ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
            <div className={styles.balanceAmountRow}>
              <span className={styles.balanceVal}>
                {showBalance ? displayBalance.toLocaleString('vi-VN') : '••••••'}
              </span>
              <span className={styles.balanceSymbol}>đ</span>
            </div>
            <div className={styles.balanceTrend}>
              <span className={styles.trendArrow}>▲</span>
              <span>+0 đ tháng này</span>
            </div>
            <div className={styles.cardNumberRow}>
              <span>
                {bankAccounts?.[0]
                  ? (showCardNumbers[bankAccounts[0].id]
                      ? bankAccounts[0].accountNumber.replace(/(\d{4})/g, '$1 ').trim()
                      : bankAccounts[0].accountNumberMasked)
                  : '**** **** **** 4821'}
              </span>
              {bankAccounts?.[0] && (
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => toggleCardVisibility(bankAccounts[0].id)}
                  aria-label="Hiển thị số thẻ"
                >
                  {showCardNumbers[bankAccounts[0].id] ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ⚪ MAIN SCROLLABLE CONTAINER */}
        <main className={styles.mainContent}>
          {/* 🚀 QUICK ACTIONS BAR */}
          <section className={styles.quickActionsContainer}>
            <div className={styles.quickActionsGrid}>
              <Link to="/transfer" className={styles.actionItem}>
                <span className={`${styles.actionIconBox} ${styles.blue}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
                <span className={styles.actionLabel}>Chuyển tiền</span>
              </Link>

              <Link to="/topup" className={styles.actionItem}>
                <span className={`${styles.actionIconBox} ${styles.green}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </span>
                <span className={styles.actionLabel}>Nạp tiền</span>
              </Link>

              <Link to="/qr-payment" className={styles.actionItem}>
                <span className={`${styles.actionIconBox} ${styles.yellow}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </span>
                <span className={styles.actionLabel}>QR Code</span>
              </Link>

              <Link to="/services" className={styles.actionItem}>
                <span className={`${styles.actionIconBox} ${styles.pink}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="4" />
                    <line x1="8" y1="2" x2="8" y2="4" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span className={styles.actionLabel}>Thanh toán</span>
              </Link>
            </div>
          </section>

          {/* 💳 MY CARDS CAROUSEL */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Thẻ của tôi</h3>
              <Link to="/profile" className={styles.sectionLink}>Thêm thẻ +</Link>
            </div>
            <div className={styles.cardsScroll}>
              <div className={`${styles.bankCardItem} ${styles.visaBg}`}>
                <div className={styles.bankCardHeaderRow}>
                  <span className={styles.bankCardType}>Thẻ thanh toán</span>
                  <span className={styles.bankCardBrand}>VISA</span>
                </div>
                <div>
                  <div className={styles.bankCardNumberRow}>
                    <span className={styles.bankCardMask}>
                      {bankAccounts?.[0]
                        ? (showCardNumbers[bankAccounts[0].id]
                            ? bankAccounts[0].accountNumber.replace(/(\d{4})/g, '$1 ').trim()
                            : bankAccounts[0].accountNumberMasked)
                        : '**** 4821'}
                    </span>
                    {bankAccounts?.[0] && (
                      <button
                        type="button"
                        className={styles.eyeBtnLight}
                        onClick={() => toggleCardVisibility(bankAccounts[0].id)}
                        aria-label="Hiển thị số thẻ"
                      >
                        {showCardNumbers[bankAccounts[0].id] ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div className={styles.bankCardBalance}>
                    {showBalance ? displayBalance.toLocaleString('vi-VN') : '••••••'} đ
                  </div>
                </div>
              </div>

              <div className={`${styles.bankCardItem} ${styles.mcBg}`}>
                <div className={styles.bankCardHeaderRow}>
                  <span className={styles.bankCardType}>Thẻ tiết kiệm</span>
                  <span className={styles.bankCardBrand}>MC</span>
                </div>
                <div>
                  <div className={styles.bankCardNumberRow}>
                    <span className={styles.bankCardMask}>
                      {bankAccounts?.[1]
                        ? (showCardNumbers[bankAccounts[1].id]
                            ? bankAccounts[1].accountNumber.replace(/(\d{4})/g, '$1 ').trim()
                            : bankAccounts[1].accountNumberMasked)
                        : '**** 7239'}
                    </span>
                    {bankAccounts?.[1] && (
                      <button
                        type="button"
                        className={styles.eyeBtnLight}
                        onClick={() => toggleCardVisibility(bankAccounts[1].id)}
                        aria-label="Hiển thị số thẻ"
                      >
                        {showCardNumbers[bankAccounts[1].id] ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div className={styles.bankCardBalance}>0 đ</div>
                </div>
              </div>
            </div>
          </section>

          {/* 🧾 RECENT TRANSACTIONS */}
          <section className={styles.section} style={{ marginBottom: 24 }}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Giao dịch gần đây</h3>
              <Link to="/transactions" className={styles.sectionLink}>Xem tất cả</Link>
            </div>
            <div className={styles.transactionsList}>
              {recentTxs.length === 0 ? (
                <div style={{ padding: '20px 0', color: '#94A3B8', textAlign: 'center', fontSize: '0.9rem' }}>
                  Chưa có giao dịch nào
                </div>
              ) : (
                recentTxs.slice(0, 4).map((tx) => (
                  <div key={tx.id} className={styles.txRow}>
                    <div className={styles.txLeft}>
                      <div
                        className={styles.txIconBox}
                        style={{ backgroundColor: tx.bgColor, color: tx.color }}
                      >
                        {tx.icon}
                      </div>
                      <div>
                        <h4 className={styles.txTitle}>{tx.title}</h4>
                        <span className={styles.txTime}>{tx.time}</span>
                      </div>
                    </div>
                    <span className={`${styles.txAmount} ${tx.amount > 0 ? styles.positive : styles.negative}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* =================== 💻 DESKTOP VIEW WRAPPER =================== */}
      <div className={styles.desktopView}>
        {/* 📊 1. FOUR METRIC CARDS ROW */}
        <section className={styles.metricsGrid}>
          {/* Card 1: Available Balance */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={styles.metricLabel}>Số dư khả dụng</span>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  aria-label="Ẩn/hiển thị số dư"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showBalance ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
              <div className={styles.metricIconCircle} style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M12 4v16" />
                </svg>
              </div>
            </div>
            <div className={styles.metricValueWrapper}>
              <span className={styles.metricValue}>
                {showBalance ? displayBalance.toLocaleString('vi-VN') : '••••••'}
              </span>
              <span className={styles.metricSymbol}>đ</span>
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.trendUp}>▲ +0đ</span>
              <span className={styles.trendLabel}>tháng này</span>
            </div>
          </div>

          {/* Card 2: Monthly Income */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Tổng thu tháng {currentMonthNum}</span>
              <div className={styles.metricIconCircle} style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </div>
            </div>
            <div className={styles.metricValueWrapper}>
              <span className={styles.metricValue}>{totalIncomeThisMonth.toLocaleString('vi-VN')}</span>
              <span className={styles.metricSymbol}>đ</span>
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.trendUp}>▲ 0%</span>
              <span className={styles.trendLabel}>so tháng trước</span>
            </div>
          </div>

          {/* Card 3: Monthly Expenses */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Tổng chi tháng {currentMonthNum}</span>
              <div className={styles.metricIconCircle} style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </div>
            </div>
            <div className={styles.metricValueWrapper}>
              <span className={styles.metricValue}>{totalExpenseThisMonth.toLocaleString('vi-VN')}</span>
              <span className={styles.metricSymbol}>đ</span>
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.trendDown}>▼ 0%</span>
              <span className={styles.trendLabel}>so tháng trước</span>
            </div>
          </div>

          {/* Card 4: Savings Card */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Tài khoản tiết kiệm</span>
              <div className={styles.metricIconCircle} style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <rect x="9" y="9" width="6" height="6" />
                </svg>
              </div>
            </div>
            <div className={styles.metricValueWrapper}>
              <span className={styles.metricValue}>0</span>
              <span className={styles.metricSymbol}>đ</span>
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.trendUp}>-</span>
              <span className={styles.trendLabel}>Chưa đăng ký</span>
            </div>
          </div>
        </section>

        {/* 🚀 2. QUICK ACTIONS CARD ROW */}
        <section className={styles.quickActionsGridDesktop}>
          <Link to="/transfer" className={styles.actionCard}>
            <div className={styles.actionCardIcon} style={{ backgroundColor: '#EBF8FF', color: '#2B6CB0' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="17" y1="17" x2="7" y2="7" />
                <polyline points="7 17 7 7 17 7" />
                <line x1="7" y1="7" x2="17" y2="17" />
                <polyline points="17 7 17 17 7 17" />
              </svg>
            </div>
            <div className={styles.actionCardMeta}>
              <h4>Chuyển tiền</h4>
              <span>Nội địa & quốc tế</span>
            </div>
          </Link>

          <Link to="/topup" className={styles.actionCard}>
            <div className={styles.actionCardIcon} style={{ backgroundColor: '#E6FFFA', color: '#319795' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div className={styles.actionCardMeta}>
              <h4>Nạp tiền</h4>
              <span>Nhiều phương thức</span>
            </div>
          </Link>

          <Link to="/qr-payment" className={styles.actionCard}>
            <div className={styles.actionCardIcon} style={{ backgroundColor: '#FFFDF5', color: '#D69E2E' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div className={styles.actionCardMeta}>
              <h4>Quét QR</h4>
              <span>Thanh toán nhanh</span>
            </div>
          </Link>

          <Link to="/services" className={styles.actionCard}>
            <div className={styles.actionCardIcon} style={{ backgroundColor: '#FFF5F7', color: '#D53F8C' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="16" y1="2" x2="16" y2="4" />
                <line x1="8" y1="2" x2="8" y2="4" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className={styles.actionCardMeta}>
              <h4>Thanh toán hóa đơn</h4>
              <span>Điện, nước, internet</span>
            </div>
          </Link>
        </section>

        {/* 🏛 3. BOTTOM TWO COLUMN GRID */}
        <section className={styles.desktopMainGrid}>
          {/* LEFT: Chart & Table */}
          <div className={styles.desktopLeftCol}>
            {/* Chart: Income/Expenses */}
            <div className={styles.desktopCard}>
              <div className={styles.cardHeaderWithLegend}>
                <h3 className={styles.desktopCardTitle}>Thu chi 6 tháng gần nhất</h3>
                <div className={styles.chartLegend}>
                  <span className={styles.legendItem}><i style={{ background: '#0C447C' }} />Thu</span>
                  <span className={styles.legendItem}><i style={{ background: '#EF4444' }} />Chi</span>
                </div>
              </div>
              
              {/* CSS Native Bar Chart */}
              <div className={styles.chartContainer}>
                <div className={styles.chartBars}>
                  {chartData.map((c) => (
                    <div key={c.month} className={styles.chartColGroup}>
                      <div className={styles.chartColWrapper}>
                        <div className={styles.chartBarThu} style={{ height: `${c.thu}%` }} />
                        <div className={styles.chartBarChi} style={{ height: `${c.chi}%` }} />
                      </div>
                      <span className={styles.chartMonthLabel}>{c.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table: Recent Transactions */}
            <div className={styles.desktopCard}>
              <div className={styles.cardHeaderWithLink}>
                <h3 className={styles.desktopCardTitle}>Giao dịch gần đây</h3>
                <Link to="/transactions" className={styles.desktopCardLink}>Xem tất cả →</Link>
              </div>
              
              <div className={styles.tableWrapper}>
                {recentTxs.length === 0 ? (
                  <div style={{ padding: '40px 0', color: '#94A3B8', textAlign: 'center' }}>
                    Chưa có giao dịch nào
                  </div>
                ) : (
                  <table className={styles.desktopTable}>
                    <thead>
                      <tr>
                        <th>NỘI DUNG</th>
                        <th>NGÀY</th>
                        <th>LOẠI</th>
                        <th style={{ textAlign: 'right' }}>SỐ TIỀN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTxs.map((tx) => (
                        <tr key={tx.id}>
                          <td>
                            <div className={styles.tableMerchant}>
                              <div
                                className={styles.merchantIcon}
                                style={{ backgroundColor: tx.bgColor, color: tx.color }}
                              >
                                {tx.icon}
                              </div>
                              <div className={styles.merchantMeta}>
                                <span className={styles.merchantTitle}>{tx.title}</span>
                                <span className={styles.merchantSubtitle}>{tx.subtitle}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={styles.tableDate}>{tx.time}</span>
                          </td>
                          <td>
                            <span
                              className={styles.tableBadge}
                              style={{
                                backgroundColor: tx.badge === 'Chi' ? '#FEE2E2' : '#D1FAE5',
                                color: tx.badge === 'Chi' ? '#991B1B' : '#065F46',
                              }}
                            >
                              {tx.badge}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`${styles.tableAmount} ${tx.amount > 0 ? styles.positiveText : styles.negativeText}`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')} đ
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Cards section & Categories progress */}
          <div className={styles.desktopRightCol}>
            {/* Card Accounts container */}
            <div className={styles.desktopCard}>
              <div className={styles.cardHeaderWithLink}>
                <h3 className={styles.desktopCardTitle}>Tài khoản của tôi</h3>
                <Link to="/profile" className={styles.desktopCardLink}>+ Thêm thẻ</Link>
              </div>
              <div className={styles.desktopCardsStack}>
                {/* Blue Payment Card */}
                <div className={`${styles.visaCardBox} ${styles.blueGradient}`}>
                  <div className={styles.cardBoxHeader}>
                    <span>TÀI KHOẢN THANH TOÁN</span>
                    <span className={styles.cardBoxBrand}>VISA</span>
                  </div>
                  <div className={styles.cardBoxMiddle}>
                    <span>
                      {bankAccounts?.[0]
                        ? (showCardNumbers[bankAccounts[0].id]
                            ? bankAccounts[0].accountNumber.replace(/(\d{4})/g, '$1 ').trim()
                            : bankAccounts[0].accountNumberMasked)
                        : '**** **** **** 4821'}
                    </span>
                    {bankAccounts?.[0] && (
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => toggleCardVisibility(bankAccounts[0].id)}
                        aria-label="Hiển thị số thẻ"
                      >
                        {showCardNumbers[bankAccounts[0].id] ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div className={styles.cardBoxAmountRow}>
                    <span className={styles.cardBoxBalance}>{displayBalance.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className={styles.cardBoxFooter}>
                    <span>Chủ thẻ: <strong>{user?.fullName?.toUpperCase() || 'NGUYÊN VĂN AN'}</strong></span>
                    <span>Hết hạn: <strong>05/28</strong></span>
                  </div>
                </div>

                {/* Dark Gray Savings Card */}
                <div className={`${styles.visaCardBox} ${styles.darkGradient}`}>
                  <div className={styles.cardBoxHeader}>
                    <span>TÀI KHOẢN TIẾT KIỆM</span>
                    <span className={styles.cardBoxBrand}>MC</span>
                  </div>
                  <div className={styles.cardBoxMiddle}>
                    <span>
                      {bankAccounts?.[1]
                        ? (showCardNumbers[bankAccounts[1].id]
                            ? bankAccounts[1].accountNumber.replace(/(\d{4})/g, '$1 ').trim()
                            : bankAccounts[1].accountNumberMasked)
                        : '**** **** **** 7239'}
                    </span>
                    {bankAccounts?.[1] && (
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => toggleCardVisibility(bankAccounts[1].id)}
                        aria-label="Hiển thị số thẻ"
                      >
                        {showCardNumbers[bankAccounts[1].id] ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <div className={styles.cardBoxAmountRow}>
                    <span className={styles.cardBoxBalance}>0 đ</span>
                  </div>
                  <div className={styles.cardBoxFooter}>
                    <span>Lãi suất: <strong>0%/năm</strong></span>
                    <span>Đáo hạn: <strong>Chưa mở</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Expenses progress card */}
            <div className={styles.desktopCard}>
              <h3 className={styles.desktopCardTitle} style={{ marginBottom: 16 }}>Chi tiêu theo danh mục</h3>
              <div className={styles.progressStack}>
                {categoryExpenses.map((cat) => (
                  <div key={cat.label} className={styles.progressItem}>
                    <div className={styles.progressItemHeader}>
                      <span className={styles.progressLabel}>{cat.label}</span>
                      <strong className={styles.progressAmount}>{cat.amount.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${cat.percent}%`, backgroundColor: cat.barColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
