# Mẫu Test Case

## TC-[Module]-[ID]: [Tên Test Case]

**Module**: [Tên module – ví dụ: WalletService, TransferController]
**Loại**: Unit Test | Integration Test | E2E Test
**Mức độ ưu tiên**: High | Medium | Low
**Tác giả**: [Tên]
**Ngày tạo**: YYYY-MM-DD

---

## Mô tả
<!-- Mô tả ngắn gọn mục tiêu của test case này -->

## Điều kiện Tiên quyết
<!-- Những gì cần chuẩn bị trước khi chạy test -->
- 
- 

## Dữ liệu Test
```json
{
  // test data
}
```

## Các Bước Thực hiện

| STT | Hành động | Dữ liệu đầu vào | Kết quả Mong đợi |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## Kết quả Mong đợi (Expected Result)

<!-- Mô tả chi tiết kết quả cần đạt được -->

### Response
```json
{
  // expected response
}
```

### Side Effects
- Database: 
- Cache: 
- Socket: 

## Test Cases Liên quan
- Xem thêm: TC-[Module]-[ID+1]

---

## Ví dụ điền đầy đủ:

## TC-WALLET-001: Chuyển khoản thành công

**Module**: WalletService.transfer()
**Loại**: Unit Test
**Mức độ ưu tiên**: High

### Mô tả
Kiểm tra hàm transfer() trả về transaction và cập nhật balance đúng khi đủ điều kiện.

### Điều kiện Tiên quyết
- Ví người gửi tồn tại, balance = 100.000đ
- Ví người nhận tồn tại, balance = 0đ
- MongoDB đang dùng Replica Set

### Dữ liệu Test
```json
{
  "fromWalletId": "wallet_001",
  "toWalletId": "wallet_002",
  "amount": 50000,
  "reference": "ref_test_001"
}
```

### Kết quả Mong đợi
- Transaction record được tạo với status = COMPLETED
- fromWallet.balance = 50.000đ
- toWallet.balance = 50.000đ
- Socket event được emit cho cả 2 user
