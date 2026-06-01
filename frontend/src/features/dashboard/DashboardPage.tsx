import { useQuery } from '@tanstack/react-query';
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
  isVerified: boolean;
}

export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [balance, setBalance] = useState<number | null>(null);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => unwrap<{ id: string; balance: number }>(await api.get('/wallets')),
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ['user-bank-accounts'],
    queryFn: async () => unwrap<LinkedBankAccount[]>(await api.get('/bank-accounts')),
  });

  useSocket(user?.id, {
    onBalanceUpdated: (b) => {
      setBalance(b);
      toast('Số dư đã cập nhật', 'success');
    },
    onNotification: (n) => {
      const note = n as { title?: string; message?: string };
      toast(note.message ?? note.title ?? 'Có thông báo mới', 'info');
    },
  });

  const displayBalance = balance ?? wallet?.balance ?? 24580000;

  // Recent transactions strictly matching image mockups
  const RECENT_TRANSACTIONS = [
    {
      id: 'tx1',
      title: 'Shopee Food',
      subtitle: '*4821',
      time: '26/05 08:30',
      amount: -85000,
      type: 'PAYMENT',
      badge: 'Chi',
      badgeColor: '#EF4444',
      icon: '🛒',
      bgColor: '#FFEBEA',
      color: '#E53E3E',
    },
    {
      id: 'tx2',
      title: 'Nguyễn Thị Lan',
      subtitle: 'Chuyển khoản',
      time: '25/05 16:45',
      amount: 500000,
      type: 'TRANSFER',
      badge: 'Thu',
      badgeColor: '#10B981',
      icon: '↓',
      bgColor: '#E6FFFA',
      color: '#319795',
    },
    {
      id: 'tx3',
      title: 'EVN Hà Nội',
      subtitle: 'Tiền điện T5',
      time: '24/05 10:00',
      amount: -312000,
      type: 'PAYMENT',
      badge: 'Chi',
      badgeColor: '#EF4444',
      icon: '⚡',
      bgColor: '#EBF8FF',
      color: '#3182CE',
    },
    {
      id: 'tx4',
      title: 'Nạp Viettel',
      subtitle: 'SĐT 090xxx',
      time: '23/05 14:20',
      amount: -100000,
      type: 'PAYMENT',
      badge: 'Chi',
      badgeColor: '#EF4444',
      icon: '📱',
      bgColor: '#FFFDF5',
      color: '#D69E2E',
    },
    {
      id: 'tx5',
      title: 'Đặt cọc thuê nhà',
      subtitle: 'CK tới VCB',
      time: '22/05 09:00',
      amount: -5000000,
      type: 'TRANSFER',
      badge: 'Chờ',
      badgeColor: '#F59E0B',
      icon: '🏦',
      bgColor: '#F3E8FF',
      color: '#8B5CF6',
    },
  ];

  const CHART_DATA = [
    { month: 'Th.12', thu: 75, chi: 60 },
    { month: 'Th.1', thu: 85, chi: 70 },
    { month: 'Th.2', thu: 60, chi: 55 },
    { month: 'Th.3', thu: 90, chi: 80 },
    { month: 'Th.4', thu: 95, chi: 85 },
    { month: 'Th.5', thu: 110, chi: 90 }, // active month
  ];

  const CATEGORY_EXPENSES = [
    { label: 'Ăn uống', amount: 1850000, percent: 70, barColor: '#F97316' },
    { label: 'Hóa đơn', amount: 1200000, percent: 50, barColor: '#3B82F6' },
    { label: 'Mua sắm', amount: 980000, percent: 40, barColor: '#EC4899' },
    { label: 'Giải trí', amount: 420000, percent: 20, barColor: '#A855F7' },
    { label: 'Khác', amount: 1400000, percent: 58, barColor: '#64748B' },
  ];

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
              <span className={styles.bellBadge} />
            </button>
          </div>

          {/* 💳 BALANCE FLOATING CARD */}
          <div className={styles.balanceCard}>
            <span className={styles.balanceLabel}>Số dư khả dụng</span>
            <div className={styles.balanceAmountRow}>
              <span className={styles.balanceVal}>{displayBalance.toLocaleString('vi-VN')}</span>
              <span className={styles.balanceSymbol}>đ</span>
            </div>
            <div className={styles.balanceTrend}>
              <span className={styles.trendArrow}>▲</span>
              <span>+2.350.000 đ tháng này</span>
            </div>
            <div className={styles.cardNumber}>
              **** **** **** {bankAccounts?.[0]?.accountNumber?.slice(-4) || '4821'}
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
                  <div className={styles.bankCardMask}>**** {bankAccounts?.[0]?.accountNumber?.slice(-4) || '4821'}</div>
                  <div className={styles.bankCardBalance}>{displayBalance.toLocaleString('vi-VN')} đ</div>
                </div>
              </div>

              <div className={`${styles.bankCardItem} ${styles.mcBg}`}>
                <div className={styles.bankCardHeaderRow}>
                  <span className={styles.bankCardType}>Thẻ tiết kiệm</span>
                  <span className={styles.bankCardBrand}>MC</span>
                </div>
                <div>
                  <div className={styles.bankCardMask}>**** {bankAccounts?.[1]?.accountNumber?.slice(-4) || '7239'}</div>
                  <div className={styles.bankCardBalance}>105.000.000 đ</div>
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
              {RECENT_TRANSACTIONS.slice(0, 4).map((tx) => (
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
              ))}
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
              <span className={styles.metricLabel}>Số dư khả dụng</span>
              <div className={styles.metricIconCircle} style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M12 4v16" />
                </svg>
              </div>
            </div>
            <div className={styles.metricValueWrapper}>
              <span className={styles.metricValue}>{displayBalance.toLocaleString('vi-VN')}</span>
              <span className={styles.metricSymbol}>đ</span>
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.trendUp}>▲ +2.35tr</span>
              <span className={styles.trendLabel}>tháng này</span>
            </div>
          </div>

          {/* Card 2: Monthly Income */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Tổng thu tháng 5</span>
              <div className={styles.metricIconCircle} style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </div>
            </div>
            <div className={styles.metricValueWrapper}>
              <span className={styles.metricValue}>8.200.000</span>
              <span className={styles.metricSymbol}>đ</span>
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.trendUp}>▲ +12%</span>
              <span className={styles.trendLabel}>so tháng trước</span>
            </div>
          </div>

          {/* Card 3: Monthly Expenses */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Tổng chi tháng 5</span>
              <div className={styles.metricIconCircle} style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </div>
            </div>
            <div className={styles.metricValueWrapper}>
              <span className={styles.metricValue}>5.850.000</span>
              <span className={styles.metricSymbol}>đ</span>
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.trendDown}>▼ -8%</span>
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
              <span className={styles.metricValue}>105.000.000</span>
              <span className={styles.metricSymbol}>đ</span>
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.trendUp}>▲ Lãi</span>
              <span className={styles.trendLabel}>5.5%/năm</span>
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
                  {CHART_DATA.map((c) => (
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
                    {RECENT_TRANSACTIONS.map((tx) => (
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
                              backgroundColor: tx.badge === 'Thu' ? '#D1FAE5' : tx.badge === 'Chi' ? '#FEE2E2' : '#FEF3C7',
                              color: tx.badge === 'Thu' ? '#065F46' : tx.badge === 'Chi' ? '#991B1B' : '#92400E',
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
                    **** **** **** {bankAccounts?.[0]?.accountNumber?.slice(-4) || '4821'}
                  </div>
                  <div className={styles.cardBoxAmountRow}>
                    <span className={styles.cardBoxBalance}>{displayBalance.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className={styles.cardBoxFooter}>
                    <span>Chủ thẻ: <strong>NGUYEN VAN AN</strong></span>
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
                    **** **** **** {bankAccounts?.[1]?.accountNumber?.slice(-4) || '7239'}
                  </div>
                  <div className={styles.cardBoxAmountRow}>
                    <span className={styles.cardBoxBalance}>105.000.000 đ</span>
                  </div>
                  <div className={styles.cardBoxFooter}>
                    <span>Lãi suất: <strong>5.5%/năm</strong></span>
                    <span>Đáo hạn: <strong>12/2026</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Expenses progress card */}
            <div className={styles.desktopCard}>
              <h3 className={styles.desktopCardTitle} style={{ marginBottom: 16 }}>Chi tiêu theo danh mục</h3>
              <div className={styles.progressStack}>
                {CATEGORY_EXPENSES.map((cat) => (
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
