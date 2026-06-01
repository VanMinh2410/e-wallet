import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { AppRoutes } from './app/routes';
import { ToastProvider } from './shared/context/ToastContext';
import { useAppDispatch } from './app/hooks';
import { setCredentials } from './features/auth/authSlice';
import api from './shared/services/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthInit({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.post('/auth/refresh-token');
        const data = res.data?.data ?? res.data;
        if (data?.accessToken && data?.user) {
          dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
        }
      } catch (err) {
        console.log('No active session:', err);
      } finally {
        setLoading(false);
      }
    };
    void initAuth();
  }, [dispatch]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC' }}>
        <div style={{ border: '3px solid #E2E8F0', borderTop: '3px solid #3B82F6', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthInit>
            <AppRoutes />
          </AuthInit>
        </ToastProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
