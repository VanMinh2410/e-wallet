# 🐛 Lệnh: Sửa Bug

## Mô tả
Quy trình chuẩn để tìm và sửa bug trong dự án HKi Wallet.

## Phân loại Mức độ Nghiêm trọng

| Mức | Mô tả | SLA Phản hồi |
|---|---|---|
| P1 – Critical | Mất tiền, bảo mật bị xâm phạm, hệ thống down | 1 giờ |
| P2 – High | Tính năng chính không hoạt động | 4 giờ |
| P3 – Medium | Tính năng phụ lỗi, có workaround | 1 ngày |
| P4 – Low | UI lỗi nhỏ, cosmetic | Sprint tiếp theo |

## Quy trình Sửa Bug

### Bước 1: Ghi nhận Bug
- Điền thông tin vào `context/known-bugs.md`
- Tạo Issue theo mẫu `templates/issue-template.md`
- Xác định mức độ nghiêm trọng (P1-P4)

### Bước 2: Tái hiện Bug
```bash
# Đảm bảo có thể tái hiện bug ổn định
# Ghi lại: điều kiện, dữ liệu, bước thực hiện
# Kiểm tra log backend
docker compose logs backend --tail=100

# Kiểm tra log frontend
# Mở DevTools → Console
```

### Bước 3: Phân tích Nguyên nhân
- Tìm file liên quan
- Đọc code path từ request → response
- Kiểm tra xem có transaction issue không
- Kiểm tra xem có race condition không
- Dùng `prompts/explain-error.md` để phân tích

### Bước 4: Tạo Branch Fix
```bash
# Format: fix/<scope>-<short-description>
git checkout -b fix/wallet-balance-negative

# Với P1 hotfix từ production:
git checkout -b hotfix/transfer-double-debit main
```

### Bước 5: Viết Test Tái hiện Bug
```typescript
// Trước tiên viết test THẤT BẠI tái hiện bug
it('không được trừ tiền hai lần khi chuyển khoản', async () => {
  // Arrange: tạo dữ liệu
  // Act: gọi API
  // Assert: kiểm tra balance đúng
});
```

### Bước 6: Sửa Bug
- Sửa code
- Chạy test để đảm bảo test vừa viết PASS
- Đảm bảo không làm hỏng test khác

### Bước 7: Kiểm tra Regression
```bash
npm run test        # Chạy toàn bộ test
npm run test:e2e    # Chạy E2E nếu cần
```

### Bước 8: Tạo PR
```bash
git commit -m "fix(wallet): prevent double debit on concurrent transfer"
git push origin fix/wallet-balance-negative
```

PR description phải có:
- Mô tả bug
- Root cause
- Cách sửa
- Test đã viết

### Bước 9: Cập nhật Known Bugs
- Đánh dấu bug là [x] đã fix trong `context/known-bugs.md`
- Ghi ngày fix và PR number

## Lưu ý với Bug P1 (Critical)
1. Thông báo ngay cho team lead
2. Xem xét rollback nếu cần
3. Theo quy trình `workflows/incident-response.md`
4. Hotfix merge trực tiếp vào main sau khi review nhanh
5. Viết post-mortem sau khi fix xong
