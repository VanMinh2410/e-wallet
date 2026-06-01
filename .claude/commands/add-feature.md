# ✨ Lệnh: Thêm Tính năng Mới

## Mô tả
Quy trình chuẩn để thêm một tính năng mới vào dự án HKi Wallet.

## Các Bước Thực Hiện

### Bước 1: Chuẩn bị
```bash
# Đảm bảo đang ở main branch và mới nhất
git checkout main
git pull origin main

# Tạo branch mới theo chuẩn naming
# Format: feature/<scope>-<short-description>
git checkout -b feature/wallet-qr-payment
```

### Bước 2: Đọc Tài liệu Liên quan
- Đọc flow tương ứng trong `skills/frontend-flows/` hoặc `skills/backend-flows/`
- Đọc `skills/business-flows/` nếu có
- Kiểm tra `rules/` liên quan

### Bước 3: Thiết kế (nếu cần)
- Tham khảo `agents/systems-architect.md` nếu cần thay đổi kiến trúc
- Tạo ADR mới nếu có quyết định kiến trúc: `templates/adr-template.md`
- Thảo luận với team trước khi implement phần phức tạp

### Bước 4: Implement Backend
```bash
# Tạo module mới nếu cần
nest g module modules/qr-payment
nest g service modules/qr-payment
nest g controller modules/qr-payment

# Hoặc thêm vào module hiện có
```

Checklist backend:
- [ ] DTO với class-validator
- [ ] Service với transaction nếu liên quan đến tiền
- [ ] Controller với đúng guards (JwtAuthGuard, ThrottleGuard)
- [ ] Unit test cho service
- [ ] Integration test cho API

### Bước 5: Implement Frontend
```bash
# Tạo feature folder mới
mkdir src/features/qr-payment
touch src/features/qr-payment/QrPaymentPage.tsx
touch src/features/qr-payment/qrPaymentSlice.ts
```

Checklist frontend:
- [ ] Component với TypeScript types
- [ ] React Query hooks cho API calls
- [ ] Loading / error / empty states
- [ ] Unit test với React Testing Library

### Bước 6: Kiểm tra Chất lượng
```bash
# Chạy lint
npm run lint

# Chạy type check
npm run type-check

# Chạy test
npm run test

# Kiểm tra coverage
npm run test:coverage
```

### Bước 7: Tạo Pull Request
```bash
git add .
git commit -m "feat(qr-payment): implement QR code payment flow"
git push origin feature/wallet-qr-payment
```

Tạo PR theo mẫu `templates/pr-template.md`.

### Bước 8: Code Review
- Request review từ ít nhất 1 team member
- Tự review lại theo `commands/review.md`
- Sửa các comment review

### Bước 9: Merge
- Squash merge vào main sau khi approved
- Xóa branch sau khi merge

## Lưu ý Quan trọng
- Mọi tính năng liên quan đến tiền phải có transaction test
- Mọi API mới phải có rate limiting
- Mọi tính năng mới phải có test trước khi merge
