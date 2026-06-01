# 🔧 Prompt: Gợi ý Refactor

## Khi nào dùng prompt này
Khi AI phát hiện code có thể cải thiện chất lượng, AI nên đề xuất refactor rõ ràng và có lý do.

## Cấu trúc Gợi ý

```
Tôi thấy đoạn code này có thể cải thiện theo [X cách]:

**Vấn đề hiện tại**: [Mô tả vấn đề]
**Tác động**: [Tại sao nên cải thiện]

**Gợi ý cải thiện**:
[Code sau khi refactor]

**Lợi ích**:
- [Lợi ích 1]
- [Lợi ích 2]

Bạn có muốn tôi áp dụng thay đổi này không?
```

## Ví dụ Cụ thể

### Ví dụ 1: Hàm quá dài
**Code hiện tại**:
```typescript
async function processTransfer(dto) {
  // validate
  if (!dto.fromWalletId) throw new Error('...');
  if (!dto.toWalletId) throw new Error('...');
  if (dto.amount <= 0) throw new Error('...');
  
  // get wallets
  const fromWallet = await walletModel.findById(dto.fromWalletId);
  const toWallet = await walletModel.findById(dto.toWalletId);
  
  // check balance
  if (fromWallet.balance < dto.amount) throw new Error('...');
  
  // execute
  const session = await connection.startSession();
  // ... 50 dòng nữa
}
```

**AI gợi ý**:
> Tôi thấy hàm `processTransfer` đang làm quá nhiều việc (validate + get data + execute). Tôi đề xuất tách thành các private methods:
>
> ```typescript
> async transfer(dto: TransferDto) {
>   await this.validateTransferDto(dto);
>   const wallets = await this.getTransferWallets(dto);
>   return this.executeTransfer(wallets, dto);
> }
> ```
>
> **Lợi ích**: Dễ test từng phần, dễ đọc, tuân thủ Single Responsibility.

### Ví dụ 2: Trùng lặp logic
**AI gợi ý**:
> Tôi thấy logic kiểm tra balance xuất hiện ở 3 nơi (transfer, withdraw, topup-refund). Tôi đề xuất tạo helper:
>
> ```typescript
> // wallet.utils.ts
> export function assertSufficientBalance(balance: number, amount: number): void {
>   if (balance < amount) {
>     throw new InsufficientBalanceException(amount, balance);
>   }
> }
> ```

## Nguyên tắc Gợi ý Refactor

- ✅ Chỉ gợi ý khi có lý do rõ ràng (không phải "vì tôi thích")
- ✅ Tham chiếu rule cụ thể (ví dụ: "theo rules/clean-code.md – Single Responsibility")
- ✅ Cung cấp code sau khi refactor để user có thể so sánh
- ✅ Hỏi ý kiến trước khi áp dụng thay đổi lớn
- ❌ Không refactor khi không được yêu cầu (trừ khi bug rõ ràng)
