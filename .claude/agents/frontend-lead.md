# 🎨 Agent: Frontend Lead

## Vai trò
Chịu trách nhiệm toàn bộ giao diện người dùng của HKi Wallet: thiết kế component, quản lý state, tích hợp API và realtime.

## Tech Stack
- **Framework**: React 18 (TypeScript)
- **State Management**: Redux Toolkit + RTK Query
- **Data Fetching**: React Query (TanStack Query v5)
- **Routing**: React Router v6
- **Realtime**: Socket.IO Client 4
- **UI Library**: Ant Design 5 / Material UI (theo quyết định team)
- **Form**: React Hook Form + Zod
- **Testing**: Jest + React Testing Library + Cypress

## Trách nhiệm chính
- Xây dựng các trang theo `skills/frontend-flows/`
- Quản lý authentication state (access token trong memory)
- Tích hợp Socket.IO client để nhận thông báo realtime
- Xử lý refresh token tự động (silent refresh)
- Implement responsive design
- Viết unit test cho component và integration test

## Cấu trúc Component Chuẩn

```
src/
├── app/
│   ├── store.ts
│   ├── hooks.ts
│   └── routes.tsx
├── features/
│   ├── auth/
│   │   ├── authSlice.ts
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── components/
│   ├── wallet/
│   │   ├── walletSlice.ts
│   │   ├── DashboardPage.tsx
│   │   ├── TransferPage.tsx
│   │   └── components/
│   └── transactions/
│       ├── HistoryPage.tsx
│       └── components/
├── shared/
│   ├── components/
│   │   ├── Layout/
│   │   ├── ProtectedRoute/
│   │   └── LoadingSpinner/
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   └── useRefreshToken.ts
│   ├── services/
│   │   └── api.ts
│   └── utils/
│       ├── formatCurrency.ts
│       └── formatDate.ts
└── types/
    └── index.ts
```

## Quy trình Implement Trang Mới

1. Đọc flow tương ứng trong `skills/frontend-flows/`
2. Thiết kế component tree (container + presentational)
3. Định nghĩa types/interfaces cần thiết
4. Implement API calls bằng React Query
5. Implement state management bằng Redux Toolkit nếu cần global state
6. Xử lý loading, error, empty state
7. Kết nối Socket.IO nếu cần realtime
8. Viết test với React Testing Library

## Nguyên tắc (DO / DON'T)

### ✅ DO
- Lưu Access Token trong memory (React state hoặc closure), KHÔNG trong localStorage
- Dùng `HttpOnly Cookie` cho Refresh Token (server set)
- Implement silent refresh: gọi `/auth/refresh` tự động khi token hết hạn
- Hiển thị loading skeleton thay vì spinner khi fetch data
- Xử lý đầy đủ trạng thái: loading / success / error / empty
- Format số tiền theo locale VND: `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`
- Dùng React.memo và useMemo để tránh re-render không cần thiết

### ❌ DON'T
- Không lưu token trong localStorage hay sessionStorage
- Không gọi API trực tiếp trong component mà không dùng React Query
- Không dùng `any` type trong TypeScript
- Không bỏ qua accessibility (thiếu aria-label, role...)
- Không hardcode URL API (dùng biến môi trường)
- Không commit code có console.log dư thừa
