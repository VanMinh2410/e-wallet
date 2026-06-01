# 🤔 Prompt: Hỏi Thêm Thông tin

## Khi nào dùng prompt này
Khi yêu cầu từ người dùng chưa đủ thông tin để thực hiện, AI nên hỏi thêm trước khi sinh code.

## Cấu trúc Câu hỏi

```
Để có thể [hành động cụ thể], tôi cần làm rõ thêm [X điểm]:

1. [Câu hỏi 1 – ngắn gọn, cụ thể]
2. [Câu hỏi 2]
3. [Câu hỏi 3]

Nếu bạn không có thông tin này, tôi có thể đề xuất một số mặc định hợp lý:
- [Gợi ý mặc định 1]
- [Gợi ý mặc định 2]
```

## Ví dụ Cụ thể

### Ví dụ 1: Yêu cầu thêm tính năng
**Yêu cầu**: "Thêm tính năng giới hạn giao dịch"

**AI hỏi**:
> Để implement tính năng giới hạn giao dịch, tôi cần làm rõ:
>
> 1. **Loại giới hạn nào?**
>    - Giới hạn số tiền tối đa/giao dịch
>    - Giới hạn tổng số tiền/ngày
>    - Giới hạn số lần giao dịch/ngày
>    - Hay tất cả?
>
> 2. **Giới hạn áp dụng cho ai?**
>    - Tất cả user
>    - Theo cấp độ tài khoản (KYC level)
>
> 3. **Giới hạn có thể tùy chỉnh không?**
>    - Cố định trong code
>    - Lưu trong database (admin có thể thay đổi)
>
> Nếu dùng mặc định: giới hạn 100tr/giao dịch, 500tr/ngày, cấu hình trong .env.

### Ví dụ 2: Yêu cầu fix bug
**Yêu cầu**: "Fix lỗi chuyển tiền"

**AI hỏi**:
> Để fix lỗi này, tôi cần thêm thông tin:
>
> 1. **Lỗi xảy ra như thế nào?** (Mô tả các bước tái hiện)
> 2. **Error message cụ thể là gì?** (Log từ backend hoặc message trên UI)
> 3. **Lỗi xảy ra trong trường hợp nào?** (Luôn luôn hay chỉ trong điều kiện nhất định?)
> 4. **Lỗi mới xảy ra gần đây không?** (Sau khi merge code nào?)

## Nguyên tắc Hỏi

- ❌ Không hỏi quá 5 câu cùng lúc
- ✅ Nhóm các câu hỏi liên quan
- ✅ Đề xuất mặc định để user có thể bỏ qua hỏi
- ✅ Hỏi câu quan trọng nhất trước
- ✅ Nếu có đủ context để đoán → đưa ra giả định và tiến hành
