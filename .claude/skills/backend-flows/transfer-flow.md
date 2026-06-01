# 💸 Backend Flow: Chuyển khoản

## Endpoint
- Method: POST
- Path: `/api/v1/wallets/:fromWalletId/transfers`
- Auth: Bearer Token (bắt buộc)
- Header bổ sung: `X-Idempotency-Key` (UUID do client tạo)

## Đầu vào (Request Body)
- `toWalletId` — ID ví người nhận (MongoId, bắt buộc)
- `amount` — Số tiền (số nguyên VND, tối thiểu 1.000, tối đa 100.000.000, bắt buộc)
- `description` — Nội dung chuyển (chuỗi, tối đa 200 ký tự, tùy chọn)
- `reference` — Idempotency key từ client (UUID, bắt buộc)

## Luồng Xử lý

1. `JwtAuthGuard` xác thực token → lấy `userId`
2. `ThrottleGuard` kiểm tra rate limit: tối đa 10 request/phút/user
3. `ValidationPipe` kiểm tra toàn bộ đầu vào
4. Controller chuyển sang `WalletService.transfer()`
5. Service thực hiện:
   - a. Kiểm tra `reference` trong Redis → nếu đã tồn tại thì trả về kết quả cũ (idempotency)
   - b. Xác nhận `fromWallet` thuộc về `userId` hiện tại
   - c. Xác nhận `toWallet` khác `fromWallet` (không tự chuyển cho mình)
   - d. Mở MongoDB Session → bắt đầu Transaction
   - e. Trong session: kiểm tra balance `fromWallet` >= `amount`
   - f. Trong session: trừ tiền `fromWallet` (`balance - amount`)
   - g. Trong session: cộng tiền `toWallet` (`balance + amount`)
   - h. Trong session: tạo bản ghi Transaction (status: COMPLETED)
   - i. Commit transaction → kết thúc session
   - j. Sau commit: emit Socket.IO event cho cả 2 ví
   - k. Sau commit: đẩy job thông báo vào BullMQ queue
   - l. Lưu kết quả vào Redis với key `reference` (TTL 24 giờ)
6. Trả về kết quả

## Đầu ra (Response thành công)
- `transactionId` — ID giao dịch
- `fromWalletId` — ID ví người gửi
- `toWalletId` — ID ví người nhận
- `amount` — Số tiền đã chuyển
- `newBalance` — Số dư mới của người gửi
- `status` — `COMPLETED`
- `createdAt` — Thời gian tạo

## Lỗi có thể xảy ra

| Tình huống | HTTP | Error Code |
|---|---|---|
| Số dư không đủ | 400 | `INSUFFICIENT_BALANCE` |
| Ví người nhận không tồn tại | 404 | `WALLET_NOT_FOUND` |
| Chuyển tiền cho chính mình | 400 | `SELF_TRANSFER_NOT_ALLOWED` |
| Ví đang bị khóa | 403 | `WALLET_INACTIVE` |
| Vượt rate limit | 429 | `RATE_LIMIT_EXCEEDED` |
| Giao dịch trùng reference | 409 | `DUPLICATE_TRANSACTION` |

## Indexes cần có
- `wallet`: index trên `userId`
- `transaction`: index trên `{ fromWalletId, createdAt }` (desc)
- `transaction`: unique index trên `reference`

## Socket Events sau khi commit
- Gửi đến người gửi: event `transaction_completed` với type `DEBIT`
- Gửi đến người nhận: event `transaction_completed` với type `CREDIT`
