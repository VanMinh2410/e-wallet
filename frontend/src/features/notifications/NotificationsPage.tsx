import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { unwrap } from '../../shared/services/api';
import { AppHeader } from '../../shared/components/Layout/AppHeader';
import { Button } from '../../shared/components/ui/Button';
import { formatDate } from '../../shared/utils/format';
import styles from './NotificationsPage.module.css';

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  type?: string;
  createdAt: string;
}

export function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { page: 1, limit: 50 } });
      return unwrap<{ items: Notification[] }>(res);
    },
  });

  const markAll = useMutation({
    mutationFn: () => api.put('/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <>
      <AppHeader variant="sub" title="Thông báo" />
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <Button variant="text" size="sm" onClick={() => markAll.mutate()}>
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
        {isLoading && <p className={styles.empty}>Đang tải...</p>}
        <ul className={styles.list}>
          {(data?.items ?? []).map((n) => (
            <li
              key={n._id}
              className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
              onClick={() => !n.isRead && markOne(n._id)}
            >
              <div className={styles.icon}>{n.type === 'transfer' ? '↔' : n.type === 'topup' ? '↓' : '🔔'}</div>
              <div className={styles.body}>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <span className={styles.time}>{formatDate(n.createdAt)}</span>
              </div>
              {!n.isRead && <span className={styles.dot} />}
            </li>
          ))}
          {!isLoading && !data?.items?.length && (
            <li className={styles.emptyState}>
              <span>🔔</span>
              <p>Chưa có thông báo</p>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
