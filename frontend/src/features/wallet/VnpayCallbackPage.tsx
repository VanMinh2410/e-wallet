import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { unwrap } from '../../shared/services/api';
import { useToast } from '../../shared/context/ToastContext';
import { SubPageShell } from '../../shared/components/Layout/SubPageShell';
import { Button } from '../../shared/components/ui/Button';
import { formatCurrency } from '../../shared/utils/format';
import styles from './FlowPages.module.css';

export function VnpayCallbackPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isStarted = useRef(false);

  useEffect(() => {
    if (isStarted.current) return;
    isStarted.current = true;

    const verifyPayment = async () => {
      // Gather all search params into an object
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      const responseCode = params['vnp_ResponseCode'];
      const vnpAmount = Number(params['vnp_Amount']) / 100;
      const ref = params['vnp_TxnRef'];
      
      setAmount(vnpAmount);
      setReference(ref);

      // Immediately fail if response code is not '00'
      if (responseCode !== '00') {
        setSuccess(false);
        setErrorMsg('Giao dịch VNPay bị hủy hoặc không thành công.');
        setLoading(false);
        return;
      }

      try {
        const res = await api.post('/transactions/vnpay/verify', params);
        const data = unwrap<{ isVerified: boolean; message: string; reference: string }>(res);
        if (data.isVerified) {
          setSuccess(true);
          qc.invalidateQueries({ queryKey: ['wallet'] });
          toast('Nạp tiền thành công!', 'success');
        } else {
          setSuccess(false);
          setErrorMsg(data.message || 'Xác nhận giao dịch thất bại.');
        }
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        setSuccess(false);
        setErrorMsg(ax.response?.data?.message || 'Xác minh giao dịch thất bại');
      } finally {
        setLoading(false);
      }
    };

    void verifyPayment();
  }, [searchParams, qc, toast]);

  const footer = (
    <Button onClick={() => navigate('/topup')} disabled={loading}>
      Về trang nạp tiền
    </Button>
  );

  return (
    <SubPageShell title="Kết quả nạp tiền" footer={footer}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 20 }}>
          <div className={styles.spinner} />
          <h3 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Đang xác minh giao dịch...</h3>
          <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>Vui lòng không đóng trình duyệt hoặc quay lại trang trước.</p>
        </div>
      ) : success ? (
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <h2>Nạp tiền thành công!</h2>
          <p>
            <span className={`${styles.statusBadge} ${styles.successBadge}`}>
              +{formatCurrency(amount)}
            </span>
          </p>
          <div style={{ marginTop: 16 }}>
            <span className={styles.refCode}>Mã GD: {reference}</span>
          </div>
          <p style={{ marginTop: 24 }}>Số dư đã được cập nhật vào ví của bạn</p>
        </div>
      ) : (
        <div className={styles.success} style={{ padding: '36px 20px' }}>
          <div className={styles.successIcon} style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', animation: 'none', boxShadow: 'none' }}>✗</div>
          <h2 style={{ color: '#DC2626' }}>Nạp tiền thất bại</h2>
          <p style={{ color: '#64748B', marginTop: 12 }}>{errorMsg}</p>
          {reference && (
            <div style={{ marginTop: 16 }}>
              <span className={styles.refCode}>Mã GD: {reference}</span>
            </div>
          )}
        </div>
      )}
    </SubPageShell>
  );
}
