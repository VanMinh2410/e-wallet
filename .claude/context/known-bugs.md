# 🐛 Danh sách Lỗi đang Theo dõi

## Hướng dẫn
- Thêm bug mới vào danh sách với checkbox `[ ]`
- Đánh dấu `[x]` khi đã fix, kèm ngày và PR
- Dùng mẫu: `- [ ] [P1/P2/P3] **Mô tả** – Người báo cáo – Ngày phát hiện`

---

## Đang Mở (Open Bugs)

- [ ] **[P3]** Sidebar menu không collapse đúng trên màn hình 768px – Reported by: FE Team – 2025-01-10
  - Chi tiết: Trên tablet, sidebar overlap content
  - Assign: Frontend Lead
  
- [ ] **[P3]** Skeleton loading hiển thị sai trên slow network – 2025-01-10
  - Repro: Throttle network xuống 3G
  - Assign: Frontend Lead

- [ ] **[P2]** Refresh token không được revoke khi đổi mật khẩu – 2025-01-08
  - Chi tiết: Sau khi đổi password, token cũ vẫn dùng được
  - Fix: Xóa `rt:<userId>` trong Redis khi đổi password
  - Assign: Backend Lead

## Đã Fix

- [x] **[P1]** MongoDB không khởi tạo replica set khi dùng Docker Compose
  - Fix: Thêm `mongo-init` service trong docker-compose.yml
  - PR: #12 – Fixed: 2025-01-05

- [x] **[P2]** Rate limit không hoạt động sau restart server
  - Root cause: Redis keys không persist khi container restart  
  - Fix: Thêm volume cho Redis container
  - PR: #15 – Fixed: 2025-01-07

## Bugs cần Phân tích thêm

- [ ] **[P3?]** Đôi khi socket disconnect sau 30 phút không hoạt động
  - Cần: Reproduce ổn định + check heartbeat config
  - Status: Investigating

---

*Cập nhật lần cuối: 2025-01-10*
