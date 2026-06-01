# 📅 Sprint Hiện tại

## Sprint 1 (Tuần 1-2)
**Mục tiêu**: Hoàn thiện Authentication và Wallet cơ bản

**Ngày bắt đầu**: 2025-01-06
**Ngày kết thúc**: 2025-01-17

## Tasks đang làm

### Backend
- [ ] [BE-001] Implement auth module (register, login, JWT)
  - Priority: P0
  - Assignee: Backend Lead
  - Status: In Progress
- [ ] [BE-002] Implement wallet module (tạo ví, xem balance)
  - Priority: P0
  - Assignee: Backend Lead
  - Status: Todo
- [ ] [BE-003] Implement transfer API với MongoDB Transaction
  - Priority: P0
  - Assignee: Backend Lead
  - Status: Todo
- [ ] [BE-004] Setup Socket.IO gateway
  - Priority: P1
  - Assignee: Backend Lead
  - Status: Todo

### Frontend
- [ ] [FE-001] Implement Login page
  - Priority: P0
  - Assignee: Frontend Lead
  - Status: In Progress
- [ ] [FE-002] Implement Register page
  - Priority: P0
  - Assignee: Frontend Lead
  - Status: Todo
- [ ] [FE-003] Implement Dashboard page
  - Priority: P0
  - Assignee: Frontend Lead
  - Status: Todo
- [ ] [FE-004] Implement Transfer page
  - Priority: P0
  - Assignee: Frontend Lead
  - Status: Todo

### DevOps
- [x] [DO-001] Setup Docker Compose với MongoDB Replica Set
- [x] [DO-002] Setup GitHub Actions CI pipeline
- [ ] [DO-003] Setup staging environment

### QA
- [ ] [QA-001] Viết test case cho auth flow
- [ ] [QA-002] Viết concurrent transfer tests

## Blockers / Rủi ro

- **Blocker**: Cần quyết định về UI library (Ant Design vs Material UI) → cần input từ team trước FE-003
- **Rủi ro**: MongoDB Replica Set trên local dev phức tạp → đã có script setup (`commands/setup.md`)

## Mục tiêu Sprint 2 (dự kiến)

- QR Payment
- Lịch sử giao dịch
- Notification realtime
- Rút tiền (basic)
