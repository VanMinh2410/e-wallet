# 🧹 Quy tắc: Clean Code

## 1. Nguyên tắc SOLID

### Single Responsibility
- Mỗi class/function chỉ làm một việc
- Service chỉ chứa business logic, Controller chỉ xử lý HTTP, Schema chỉ định nghĩa data

### Open/Closed
- Mở cho extension, đóng với modification
- Dùng interface và dependency injection

### Interface Segregation
- Không ép client implement interface không cần thiết
- Tách interface nhỏ thay vì một interface lớn

### Dependency Inversion
- Phụ thuộc vào abstraction, không phụ thuộc vào implementation
- Dùng NestJS DI container đúng cách

## 2. Hàm Ngắn và Rõ ràng

```typescript
// ❌ Sai – hàm quá dài, làm quá nhiều việc
async function processTransfer(dto) {
  // 100 dòng code...
}

// ✅ Đúng – tách thành các hàm nhỏ
async function transfer(dto: TransferDto) {
  await this.validateTransfer(dto);
  const { fromWallet, toWallet } = await this.getWallets(dto);
  const transaction = await this.executeTransfer(fromWallet, toWallet, dto);
  await this.notifyUsers(transaction);
  return transaction;
}
```

Giới hạn:
- Hàm: tối đa 30 dòng logic
- File: tối đa 300 dòng
- Tham số hàm: tối đa 3 (nếu nhiều hơn, dùng object)

## 3. Đặt tên Có Ý nghĩa

```typescript
// ❌ Sai
const d = new Date();
const u = await this.findUser(id);
function calc(a: number, b: number) {}

// ✅ Đúng
const transactionDate = new Date();
const sender = await this.findUserById(senderId);
function calculateTransferFee(amount: number, rate: number) {}
```

## 4. Tránh Magic Number

```typescript
// ❌ Sai
if (loginAttempts >= 5) throw new Error('...');
const token = sign(payload, secret, { expiresIn: 900 });

// ✅ Đúng
const MAX_LOGIN_ATTEMPTS = 5;
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 phút

if (loginAttempts >= MAX_LOGIN_ATTEMPTS) throw new TooManyAttemptsException();
const token = sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS });
```

## 5. DRY – Don't Repeat Yourself

```typescript
// ❌ Sai – logic format tiền lặp nhiều nơi
const formatted1 = amount.toLocaleString('vi-VN') + ' ₫';
const formatted2 = total.toLocaleString('vi-VN') + ' ₫';

// ✅ Đúng – tách ra utility
// utils/currency.ts
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
```

## 6. Early Return

```typescript
// ❌ Sai – nhiều tầng if lồng nhau
async function transfer(dto) {
  if (wallet) {
    if (wallet.balance >= dto.amount) {
      if (dto.amount > 0) {
        // logic...
      }
    }
  }
}

// ✅ Đúng – early return
async function transfer(dto) {
  if (!wallet) throw new WalletNotFoundException();
  if (dto.amount <= 0) throw new InvalidAmountException();
  if (wallet.balance < dto.amount) throw new InsufficientBalanceException();
  // logic chính...
}
```

## 7. Comment Đúng Chỗ

```typescript
// ❌ Sai – comment giải thích code hiển nhiên
// Tăng balance lên amount
wallet.balance += amount;

// ✅ Đúng – comment giải thích WHY (không phải WHAT)
// Dùng findOneAndUpdate thay vì save() để tránh race condition
// khi nhiều transaction chạy đồng thời
await wallet.findOneAndUpdate(
  { _id: id, __v: version },
  { $inc: { balance: amount } }
);
```

## 8. Xử lý Async Đúng Cách

```typescript
// ❌ Sai – không xử lý lỗi
async function riskyOperation() {
  const result = await fetchData();
  return result;
}

// ✅ Đúng – luôn có error handling
async function riskyOperation() {
  try {
    const result = await fetchData();
    return result;
  } catch (error) {
    this.logger.error('fetchData failed:', error);
    throw new InternalServerErrorException('Không thể lấy dữ liệu');
  }
}
```
