# 📖 READING ORDER – Hướng dẫn AI đọc file theo thứ tự

Khi bạn (AI Agent) được yêu cầu thực hiện bất kỳ nhiệm vụ nào liên quan đến dự án HKi Wallet, hãy **đọc các file theo thứ tự dưới đây**. Không bỏ qua bước nào trừ khi đã có kiến thức tương đương từ ngữ cảnh trước đó.

---

## 🔢 Thứ tự Bắt buộc (Đọc trước tiên)

| Thứ tự | File | Mục đích |
|---|---|---|
| 1 | `.claude/CLAUDE.md` | Hiểu tổng quan dự án, nguyên tắc làm việc cốt lõi |
| 2 | `.claude/rules/tech-stack.md` | Xác định công nghệ chính xác (React, NestJS, MongoDB, Redis, Socket.IO) |
| 3 | `.claude/rules/project-structure.md` | Biết cấu trúc thư mục code backend/frontend |
| 4 | `.claude/rules/commit-convention.md` | Để viết commit message đúng chuẩn sau khi sinh code |
| 5 | `.claude/rules/database.md` | Ràng buộc về MongoDB, transaction, index, schema |
| 6 | `.claude/rules/security.md` | Bảo mật (bcrypt, JWT, rate limit, CORS) |
| 7 | `.claude/rules/api-conventions.md` | Chuẩn REST API, response format, HTTP status codes |
| 8 | `.claude/rules/error-handling.md` | Xử lý lỗi, logging, rollback transaction |
| 9 | `.claude/rules/testing.md` | Yêu cầu coverage, loại test, cách viết test |

Sau đó, **tuỳ theo loại nhiệm vụ**, tiếp tục đọc như bên dưới.

---

## 🔀 Đọc theo Loại Nhiệm vụ

### 🟦 Nếu nhiệm vụ liên quan đến Backend / API

```
1. .claude/skills/technical/mongodb-transaction.md   ← BẮT BUỘC nếu có ghi DB
2. .claude/skills/technical/jwt-refresh-token.md     ← Nếu liên quan đến auth
3. .claude/skills/technical/socket-io-realtime.md    ← Nếu cần emit event
4. .claude/skills/technical/bullmq-queue.md          ← Nếu có job async
5. .claude/skills/technical/redis-cache-strategy.md  ← Nếu có caching
6. .claude/skills/technical/webhook-integration.md   ← Nếu có webhook
7. .claude/skills/technical/error-recovery.md        ← Luôn đọc khi xử lý lỗi
8. .claude/skills/backend-flows/<tên-chức-năng>.md   ← Ví dụ: transfer-flow.md
9. .claude/skills/business-flows/<tên-flow>.md       ← Để hiểu nghiệp vụ
```

### 🟩 Nếu nhiệm vụ liên quan đến Frontend / UI

```
1. .claude/skills/technical/socket-io-realtime.md    ← Frontend dùng socket client
2. .claude/skills/technical/jwt-refresh-token.md     ← Silent refresh, token in memory
3. .claude/skills/frontend-flows/<màn-hình>.md       ← Ví dụ: transfer-flow.md
4. .claude/skills/business-flows/<tên-flow>.md       ← Hiểu hành vi người dùng
```

### 🟨 Nếu nhiệm vụ liên quan đến Kiểm thử

```
1. .claude/rules/testing.md                          ← (đọc lại)
2. .claude/skills/testing-flows/transfer-test.md
3. .claude/skills/testing-flows/concurrent-transfer-test.md
4. .claude/skills/testing-flows/socket-test.md
5. .claude/skills/testing-flows/topup-queue-test.md
```

### 🟥 Nếu nhiệm vụ là Deploy / CI/CD

```
1. .claude/commands/deploy.md
2. .claude/workflows/release-process.md
3. .claude/automation/ci-pipeline.yml
4. .claude/automation/auto-trigger-tests.sh
```

### 🟧 Nếu nhiệm vụ là Fix Bug

```
1. .claude/commands/fix-bug.md
2. .claude/context/known-bugs.md
3. .claude/skills/technical/error-recovery.md
4. .claude/workflows/incident-response.md   ← Nếu là P1/P2 critical
```

### ⬛ Nếu nhiệm vụ là Thêm Tính năng Mới

```
1. .claude/commands/add-feature.md
2. .claude/context/current-sprint.md         ← Kiểm tra priority
3. .claude/skills/business-flows/<flow>.md   ← Hiểu nghiệp vụ
4. .claude/workflows/feature-lifecycle.md    ← Quy trình đầy đủ
5. .claude/templates/adr-template.md         ← Nếu có thay đổi kiến trúc
```

---

## 📌 Đọc khi cần (On-demand)

| File | Khi nào đọc |
|---|---|
| `.claude/agents/<role>.md` | Khi được yêu cầu đóng vai trò cụ thể (backend-lead, qa-engineer...) |
| `.claude/templates/pr-template.md` | Khi cần tạo Pull Request |
| `.claude/templates/issue-template.md` | Khi cần báo cáo bug |
| `.claude/templates/adr-template.md` | Khi có quyết định kiến trúc mới |
| `.claude/templates/test-case-template.md` | Khi viết test case mới |
| `.claude/templates/commit-message-template.txt` | Khi cần viết commit |
| `.claude/prompts/ask-missing-info.md` | Khi yêu cầu chưa đủ rõ ràng |
| `.claude/prompts/suggest-refactor.md` | Khi phát hiện code có thể cải thiện |
| `.claude/prompts/explain-error.md` | Khi phân tích và giải thích lỗi |
| `.claude/context/decisions.md` | Khi cần biết quyết định kiến trúc đã có |
| `.claude/scripts/seed-database.js` | Khi cần hiểu dữ liệu mẫu |
| `.claude/validators/*.js` | Khi chạy kiểm tra tuân thủ quy tắc |

---

## ⚠️ Quy tắc Quan trọng

> **KHÔNG BAO GIỜ** sinh code liên quan đến tiền (chuyển khoản, nạp/rút) mà không đọc trước:
> - `rules/database.md` (transaction bắt buộc)
> - `skills/technical/mongodb-transaction.md` (code pattern)
> - `rules/security.md` (rate limit, auth)

> **KHÔNG BAO GIỜ** emit Socket.IO event trước khi đọc:
> - `skills/technical/socket-io-realtime.md`

> **KHÔNG BAO GIỜ** implement JWT mà không đọc:
> - `skills/technical/jwt-refresh-token.md`

---

## 🗺️ Sơ đồ tóm tắt

```
Nhận nhiệm vụ
     │
     ▼
[1] CLAUDE.md + rules/ (tech-stack → database → security → api → error → testing)
     │
     ▼
[2] skills/technical/ (chọn đúng file theo kỹ thuật cần dùng)
     │
     ▼
[3] skills/business-flows/ (hiểu nghiệp vụ)
     │
     ├──► Backend? → skills/backend-flows/<chức-năng>.md
     ├──► Frontend? → skills/frontend-flows/<màn-hình>.md
     └──► Test? → skills/testing-flows/<test-file>.md
     │
     ▼
[4] Sinh code → Viết test → Commit (theo commit-convention.md)
     │
     ▼
[5] Tạo PR (templates/pr-template.md) → Review (commands/review.md)
```

---

*Cập nhật: 2025-01-01 | Phiên bản: 1.0.0*
