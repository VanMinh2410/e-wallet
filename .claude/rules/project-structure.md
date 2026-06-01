# 📁 Quy tắc: Cấu trúc Dự án

## Monorepo Structure

```
hki-wallet/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # React App
├── packages/
│   └── shared/           # Types, utils dùng chung
├── docs/                 # Tài liệu kỹ thuật
├── .claude/              # Cấu hình AI
├── docker-compose.yml
├── docker-compose.prod.yml
└── package.json          # Root workspaces
```

## Backend Structure (NestJS)

```
apps/backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   ├── guards/
│   │   │   └── dto/
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.service.ts
│   │   │   ├── schemas/
│   │   │   └── dto/
│   │   ├── wallets/
│   │   │   ├── wallets.module.ts
│   │   │   ├── wallets.controller.ts
│   │   │   ├── wallets.service.ts
│   │   │   ├── schemas/
│   │   │   └── dto/
│   │   ├── transactions/
│   │   ├── notifications/
│   │   └── queue/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── constants/
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── jwt.config.ts
│   └── gateways/
│       └── notification.gateway.ts
├── test/
│   ├── unit/
│   └── integration/
├── .env.example
├── Dockerfile
└── package.json
```

## Frontend Structure (React)

```
apps/frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   └── routes.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authSlice.ts
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── components/
│   │   ├── wallet/
│   │   │   ├── TransferPage.tsx
│   │   │   ├── TopupPage.tsx
│   │   │   ├── WithdrawPage.tsx
│   │   │   └── components/
│   │   ├── transactions/
│   │   │   ├── HistoryPage.tsx
│   │   │   └── components/
│   │   └── profile/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── ProtectedRoute/
│   │   │   └── ui/
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── utils/
│   │       ├── currency.ts
│   │       └── date.ts
│   └── types/
│       └── index.ts
├── public/
├── cypress/
│   └── e2e/
├── .env.example
├── Dockerfile
└── package.json
```

## Quy tắc Đặt File

- **1 component = 1 file** (không nhét nhiều component vào 1 file lớn)
- **Test file** đặt cạnh file gốc: `wallets.service.spec.ts`
- **Schema/Entity** đặt trong thư mục `schemas/` của module
- **DTO** đặt trong thư mục `dto/` của module
- **Shared code** đặt trong `common/` (backend) hoặc `shared/` (frontend)
