# 📝 Quy tắc: Commit Convention

## Format Chuẩn

```
<type>(<scope>): <subject>

[body] (tùy chọn)

[footer] (tùy chọn)
```

## Các Type Hợp lệ

| Type | Mô tả | Ví dụ |
|---|---|---|
| `feat` | Tính năng mới | `feat(wallet): add QR payment` |
| `fix` | Sửa bug | `fix(auth): handle expired refresh token` |
| `refactor` | Cải thiện code (không fix bug, không thêm tính năng) | `refactor(transaction): extract helper function` |
| `test` | Thêm/sửa test | `test(wallet): add concurrent transfer test` |
| `docs` | Cập nhật tài liệu | `docs(api): update Swagger annotation` |
| `style` | Format, spacing (không ảnh hưởng logic) | `style(auth): fix indentation` |
| `chore` | Cấu hình, build, dependencies | `chore: update mongoose to v8.1` |
| `perf` | Cải thiện performance | `perf(query): add index on wallet.userId` |
| `ci` | CI/CD config | `ci: add staging deploy step` |
| `hotfix` | Sửa lỗi khẩn cấp trên production | `hotfix(transfer): prevent double debit` |

## Scope Hợp lệ cho HKi Wallet

`auth`, `wallet`, `transaction`, `transfer`, `topup`, `withdraw`, `qr`, `notification`, `user`, `queue`, `socket`, `cache`, `config`, `docker`, `db`

## Quy tắc Viết Subject

- **Tiếng Anh** hoặc **Tiếng Việt** (thống nhất trong team)
- Bắt đầu bằng động từ nguyên thể: `add`, `fix`, `update`, `remove`, `implement`
- Không viết hoa chữ đầu
- Không kết thúc bằng dấu chấm
- Tối đa 72 ký tự

## Ví dụ Commit Đúng

```
feat(transfer): implement money transfer with MongoDB transaction

- Add transfer DTO validation
- Implement atomic debit/credit with session
- Emit socket event after commit

Closes #42
```

```
fix(auth): prevent refresh token reuse after logout

RT đã logout phải bị blacklist trong Redis ngay lập tức.

Fixes #87
```

## Ví dụ Commit SAI

```
❌ update code
❌ fix bug
❌ WIP
❌ Đã sửa lỗi chuyển tiền trừ hai lần
❌ feat: add feature add transfer add wallet update
```

## Breaking Change

Thêm `BREAKING CHANGE:` vào footer:
```
feat(api)!: change transfer response format

BREAKING CHANGE: response.data.transactionId renamed to response.data.id
```
