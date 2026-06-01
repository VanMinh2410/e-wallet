import { SubPageShell } from '../../shared/components/Layout/SubPageShell';
import { useToast } from '../../shared/context/ToastContext';
import styles from './ServicesPage.module.css';

interface ServiceItem {
  id: string;
  name: string;
  iconPath: string;
  color: string;
  bgColor: string;
}

interface ServiceCategory {
  title: string;
  items: ServiceItem[];
}

export function ServicesPage() {
  const { toast } = useToast();

  const SERVICES: ServiceCategory[] = [
    {
      title: 'DỊCH VỤ THIẾT YẾU',
      items: [
        {
          id: 'dien',
          name: 'Tiền điện',
          bgColor: '#FFFBEB',
          color: '#D97706',
          iconPath: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
        },
        {
          id: 'nuoc',
          name: 'Tiền nước',
          bgColor: '#EFF6FF',
          color: '#2563EB',
          iconPath: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
        },
        {
          id: 'internet',
          name: 'Internet',
          bgColor: '#F5F3FF',
          color: '#7C3AED',
          iconPath: 'M5 12.55a11 11 0 0 1 14.08 0 M1.42 9a16 16 0 0 1 21.16 0 M8.59 16.11a6 6 0 0 1 6.82 0 M12 20h.01',
        },
        {
          id: 'dienthoai',
          name: 'Điện thoại',
          bgColor: '#ECFDF5',
          color: '#10B981',
          iconPath: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm7 14h.01',
        },
      ],
    },
    {
      title: 'MUA SẮM & GIẢI TRÍ',
      items: [
        {
          id: 'game',
          name: 'Game Online',
          bgColor: '#FEF2F2',
          color: '#EF4444',
          iconPath: 'M6 12h4 M8 10v4 M15 11h.01 M18 13h.01 M18 11h.01 M15 13h.01 M21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
        },
        {
          id: 'maybay',
          name: 'Vé máy bay',
          bgColor: '#EFF6FF',
          color: '#3B82F6',
          iconPath: 'M21 16V8a2 2 0 0 0-2-2h-3l-4-4H9l2 4H6L4 4H2l2 4h-2v2l3 3v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z',
        },
        {
          id: 'phim',
          name: 'Xem phim',
          bgColor: '#FCE7F3',
          color: '#DB2777',
          iconPath: 'M2 2h20v20H2zm0 5h20M2 17h20 M7 2v20 M17 2v20',
        },
        {
          id: 'khachsan',
          name: 'Khách sạn',
          bgColor: '#FFFBEB',
          color: '#F59E0B',
          iconPath: 'M3 21h18 M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16 M9 9h2 M9 13h2 M13 9h2 M13 13h2',
        },
      ],
    },
    {
      title: 'TÀI CHÍNH',
      items: [
        {
          id: 'tragop',
          name: 'Trả góp',
          bgColor: '#ECFDF5',
          color: '#059669',
          iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
        },
        {
          id: 'baohiem',
          name: 'Bảo hiểm',
          bgColor: '#F5F3FF',
          color: '#8B5CF6',
          iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        },
        {
          id: 'chungkhoan',
          name: 'Chứng khoán',
          bgColor: '#FFFBEB',
          color: '#D97706',
          iconPath: 'M3 3v18h18 M18.7 8l-5.1 5.2-2.8-2.7L7 14.3',
        },
        {
          id: 'tietkiem',
          name: 'Tiết kiệm',
          bgColor: '#EFF6FF',
          color: '#2563EB',
          iconPath: 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7 M12 2v10 M9 5l3-3 3 3',
        },
      ],
    },
  ];

  const handleServiceClick = (name: string) => {
    toast(`⚡ Chức năng thanh toán "${name}" đang được kết nối với cổng thanh toán đối tác!`, 'info');
  };

  return (
    <SubPageShell title="Thanh toán dịch vụ" backTo="/dashboard">
      <div className={styles.container}>
        {SERVICES.map((cat, idx) => (
          <div key={idx} className={styles.section}>
            <h3 className={styles.sectionTitle}>{cat.title}</h3>
            <div className={styles.grid}>
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.item}
                  onClick={() => handleServiceClick(item.name)}
                >
                  <div
                    className={styles.iconBox}
                    style={{ backgroundColor: item.bgColor, color: item.color }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={item.iconPath} />
                    </svg>
                  </div>
                  <span className={styles.itemName}>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SubPageShell>
  );
}
