import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { TransferPage } from '../features/wallet/TransferPage';
import { TopupPage } from '../features/wallet/TopupPage';
import { VnpayCallbackPage } from '../features/wallet/VnpayCallbackPage';
import { VnpayMockPage } from '../features/wallet/VnpayMockPage';
import { WithdrawPage } from '../features/wallet/WithdrawPage';
import { QrPaymentPage } from '../features/wallet/QrPaymentPage';
import { HistoryPage } from '../features/transactions/HistoryPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { AdminPage } from '../features/admin/AdminPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { ServicesPage } from '../features/services/ServicesPage';
import { Layout } from '../shared/components/Layout/Layout';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/topup/vnpay-callback" element={<VnpayCallbackPage />} />
        <Route path="/sandbox/vnpay-mock" element={<VnpayMockPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<HistoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/topup" element={<TopupPage />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="/qr-payment" element={<QrPaymentPage />} />
          </Route>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
