export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const TX_TYPE_LABELS: Record<string, string> = {
  TRANSFER: 'Chuyển tiền',
  DEPOSIT: 'Nạp tiền',
  WITHDRAW: 'Rút tiền',
  PAYMENT: 'Thanh toán QR',
  REFUND: 'Hoàn tiền',
};

export const TX_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang xử lý',
  PROCESSING: 'Đang xử lý',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
};

export function maskBalance(balance: number, hidden: boolean): string {
  return hidden ? '••••••••' : formatCurrency(balance);
}
