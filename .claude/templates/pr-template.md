## Mô tả

<!-- Mô tả ngắn gọn những gì PR này thực hiện -->

## Loại thay đổi

- [ ] ✨ Tính năng mới (feat)
- [ ] 🐛 Sửa bug (fix)
- [ ] 🔥 Hotfix (hotfix)
- [ ] ♻️ Refactoring (refactor)
- [ ] 📝 Tài liệu (docs)
- [ ] 🧪 Test (test)
- [ ] 🔧 Cấu hình (chore)
- [ ] ⚡ Performance (perf)

## Thay đổi chính

<!-- Liệt kê các thay đổi cụ thể -->
- 
- 
- 

## Issue liên quan

<!-- Đóng issue nào? -->
Closes #

## Screenshot / Video (nếu có thay đổi UI)

<!-- Paste ảnh chụp màn hình hoặc GIF -->

## Checklist

### Code Quality
- [ ] Đã đọc và tuân thủ `rules/code-style.md`
- [ ] Đã đọc và tuân thủ `rules/naming-conventions.md`
- [ ] Không có `any` type trong TypeScript
- [ ] Không có `console.log` dư thừa
- [ ] Không có dead code

### Security
- [ ] Input đã được validate (class-validator / Zod)
- [ ] API mới có authentication guard
- [ ] Rate limiting đã cấu hình (nếu cần)
- [ ] Không log thông tin nhạy cảm

### Database (nếu có thay đổi)
- [ ] Thao tác tài chính dùng MongoDB Transaction
- [ ] Index đã tạo cho field query thường xuyên
- [ ] Không có N+1 query

### Test
- [ ] Đã viết unit test
- [ ] Đã viết integration test (nếu cần)
- [ ] Coverage đạt ngưỡng theo `rules/testing.md` cho code mới
- [ ] Tất cả test pass (`npm run test`)

### API (nếu có API mới)
- [ ] Response theo format chuẩn (`rules/api-conventions.md`)
- [ ] HTTP status code đúng
- [ ] Swagger annotation đầy đủ

### Socket (nếu liên quan Socket.IO)
- [ ] Emit event SAU KHI transaction commit
- [ ] Không emit trong try block

## Hướng dẫn Test

<!-- Mô tả các bước để reviewer có thể test thủ công -->

1. 
2. 
3. 

## Ghi chú cho Reviewer

<!-- Bất kỳ thông tin nào cần lưu ý khi review -->
