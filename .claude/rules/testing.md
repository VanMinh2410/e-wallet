# 🧪 Quy tắc: Testing

## Nguyên tắc Chung

- Viết test TRƯỚC khi sửa bug (TDD cho bug fix)
- Test phải **độc lập** (không phụ thuộc thứ tự chạy)
- Test phải **tất định** (không random, không phụ thuộc thời gian thực)
- Test phải **nhanh** (unit test < 100ms, integration test < 5s)
- Tên test: **mô tả behavior**, không mô tả implementation

## Phân Tầng Test (Testing Pyramid)

```
         /\
        /E2E\          5% – Cypress, chạy chậm
       /------\
      /Integra-\      25% – Supertest + MongoDB in-memory
     / tion Test \
    /-------------\
   /  Unit Tests   \   70% – Jest + Mock
  /-----------------\
```

## Chuẩn Đặt tên Test

```typescript
describe('WalletService', () => {
  describe('transfer()', () => {
    it('nên chuyển tiền thành công khi số dư đủ', async () => {});
    it('nên throw InsufficientBalanceException khi số dư không đủ', async () => {});
    it('nên rollback transaction khi lỗi xảy ra giữa chừng', async () => {});
    it('nên emit socket event sau khi transaction commit', async () => {});
  });
});
```

## Yêu cầu Coverage

| Layer | Branch Coverage | Statement Coverage |
|---|---|---|
| Services | ≥ 85% | ≥ 85% |
| Controllers | ≥ 70% | ≥ 70% |
| Utils/Helpers | ≥ 95% | ≥ 95% |
| Frontend Components | ≥ 70% | ≥ 70% |

## Test Doubles

```typescript
// Dùng Jest mock đúng cách
const mockWalletModel = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
};

// Dùng jest.spyOn khi muốn giữ implementation gốc
const spy = jest.spyOn(walletService, 'findById');

// Reset mock sau mỗi test
afterEach(() => {
  jest.clearAllMocks();
});
```

## Test Cases Bắt buộc cho Tính năng Tài chính

Mọi API liên quan đến tiền PHẢI có:

1. ✅ Happy path – thành công
2. ✅ Số dư không đủ
3. ✅ Transaction rollback khi lỗi
4. ✅ Concurrent requests (race condition)
5. ✅ Idempotency (gọi 2 lần → kết quả giống nhau)
6. ✅ Invalid input validation
7. ✅ Authentication/Authorization

## Công cụ

```bash
# Backend unit test
npm run test

# Backend với coverage
npm run test:cov

# Backend integration (cần mongodb-memory-server)
npm run test:integration

# Frontend
npm run test

# E2E
npm run cypress:run
```
