# 🧪 Lệnh: Chạy Test

## Mô tả
Các lệnh chạy test cho từng layer của dự án HKi Wallet.

## Test Backend (NestJS)

### Unit Test
```bash
cd apps/backend

# Chạy tất cả unit test
npm run test

# Chạy test với watch mode (dev)
npm run test:watch

# Chạy test theo file cụ thể
npm run test -- wallets.service.spec.ts

# Xem coverage report
npm run test:cov
```

### Integration Test
```bash
cd apps/backend

# Chạy integration test (cần MongoDB in-memory)
npm run test:integration

# Chạy với debug
npm run test:integration -- --verbose
```

### E2E Test (Backend)
```bash
cd apps/backend

# Cần backend đang chạy
npm run test:e2e
```

## Test Frontend (React)

### Unit Test
```bash
cd apps/frontend

# Chạy tất cả test
npm run test

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage
```

### E2E Test (Cypress)
```bash
cd apps/frontend

# Mở Cypress GUI (dev)
npm run cypress:open

# Chạy headless (CI)
npm run cypress:run

# Chạy test cụ thể
npm run cypress:run -- --spec "cypress/e2e/transfer.cy.ts"
```

## Test Toàn Dự Án

### Chạy Tất cả Test
```bash
# Từ root
npm run test:all

# Hoặc chạy song song
npm run test:backend & npm run test:frontend
```

### Load Test (k6)
```bash
# Cần k6 cài đặt (https://k6.io/docs/getting-started/installation/)
# Test concurrent transfer
k6 run .claude/scripts/load-test-transfer.js --vus 50 --duration 30s
```

## Yêu cầu Coverage Tối thiểu

| Layer | Coverage |
|---|---|
| Backend Services | ≥ 85% |
| Backend Controllers | ≥ 70% |
| Frontend Components | ≥ 70% |
| Frontend Utils | ≥ 95% |

## Tích hợp CI

Tất cả test chạy tự động khi:
- Tạo Pull Request
- Push vào branch main

Xem `.claude/automation/ci-pipeline.yml` để biết chi tiết.

## Debug Test Thất bại

```bash
# Chạy test với output chi tiết
npm run test -- --verbose

# Chạy test đơn lẻ với debug
node --inspect-brk node_modules/.bin/jest wallets.service.spec.ts

# Xem snapshot khác biệt
npm run test -- --updateSnapshot
```
