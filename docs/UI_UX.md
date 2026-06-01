# UI/UX Design System — HKi Wallet

## 1. Triết Lý Thiết Kế

HKi Wallet hướng tới trải nghiệm **premium banking app** — không phải fintech đơn giản. Mỗi màn hình phải đủ để người dùng tin tưởng, thao tác nhanh và cảm thấy an toàn.

**Nguyên tắc:**
- **Mobile-first**: ưu tiên trải nghiệm 375–430px
- **Trust by design**: màu sắc, typography tạo cảm giác chuyên nghiệp
- **Feedback ngay lập tức**: mọi action đều có phản hồi (loading, toast, animation)
- **Progressive disclosure**: hiển thị thông tin theo từng bước, không làm người dùng choáng ngợp

---

## 2. Hệ Màu (Color System)

### Primary Brand
| Token | Value | Mô tả |
|---|---|---|
| `--color-primary` | `#4f46e5` | Indigo — màu chính (trust + premium) |
| `--color-primary-dark` | `#3730a3` | Indigo đậm — hover states |
| `--color-primary-light` | `#6366f1` | Indigo nhạt — borders, accents |
| `--gradient-header` | `#6366f1 → #3730a3` | Gradient header |
| `--gradient-card` | `#6366f1 → #4f46e5` | Gradient balance card |

### Transaction Colors (không dùng màu hồng)
| Token | Background | Text | Gradient | Dùng cho |
|---|---|---|---|---|
| `--tx-deposit-*` | `#ecfdf5` | `#059669` | green | Nạp tiền |
| `--tx-withdraw-*` | `#fff7ed` | `#ea580c` | orange | Rút tiền |
| `--tx-transfer-*` | `#eff6ff` | `#2563eb` | blue | Chuyển ví |
| `--tx-payment-*` | `#f5f3ff` | `#7c3aed` | purple | QR Pay |

### Semantic
| Token | Value | Dùng cho |
|---|---|---|
| `--color-success` | `#059669` | Thành công |
| `--color-warning` | `#d97706` | Cảnh báo |
| `--color-danger` | `#dc2626` | Lỗi, nguy hiểm |
| `--color-info` | `#0284c7` | Thông tin |

### Surface
| Token | Value | Dùng cho |
|---|---|---|
| `--color-bg` | `#f1f5f9` | Background app |
| `--color-surface` | `#ffffff` | Card, modal |
| `--color-surface-2` | `#f8fafc` | Input bg, secondary surface |
| `--color-border` | `#e2e8f0` | Border nhạt |
| `--color-border-strong` | `#cbd5e1` | Border đậm hơn |

---

## 3. Typography

**Font family:** `Inter` (Google Fonts) → fallback: `-apple-system, BlinkMacSystemFont, Segoe UI`

| Scale | Size | Weight | Dùng cho |
|---|---|---|---|
| Display | 36px | 900 | Số tiền chính |
| H1 | 22px | 800 | Page title |
| H2 | 18px | 700 | Section title |
| Body | 14–15px | 400–600 | Content |
| Label | 12–13px | 600–700 | Labels, chips |
| Caption | 11–12px | 400–600 | Timestamps, codes |

---

## 4. Shadows & Radius

### Shadows
```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06)       /* cards nhỏ */
--shadow-md: 0 4px 16px rgba(0,0,0,0.08)       /* cards chính */
--shadow-lg: 0 8px 32px rgba(79,70,229,0.15)   /* modals, floating */
```

### Border Radius
```css
--radius-sm: 8px    /* chips, badges */
--radius-md: 12px   /* inputs, cards nhỏ */
--radius-lg: 16px   /* cards, panels */
--radius-xl: 24px   /* modal bottom sheet, QR frame */
--radius-full: 9999px  /* pills, avatars */
```

---

## 5. Components Chính

### OTP Modal
- **6 ô input tách biệt** — auto-focus next, backspace back
- **Paste support** — dán 6 chữ số tự điền
- **Countdown 2 phút** — sau đó unlock "Gửi lại"
- **Email hint** — hiển thị `n***@gmail.com`
- **Shake animation** khi sai OTP
- **Dev mode badge** khi SMTP chưa config

### Flow Pages (Chuyển/Nạp/Rút)
- **3-step wizard**: Nhập → Xác nhận → Kết quả
- **Quick amount chips**: 50K, 100K, 200K, 500K, 1M, 2M
- **Confirm card**: header gradient, amount lớn nổi bật
- **Success screen**: pulse animation, mã reference
- **OTP warning**: banner cảnh báo khi cần OTP

### Transaction History
- **Filter chips** với icon theo loại GD
- **Skeleton loading** — shimmer animation
- **Empty state** — icon + message rõ ràng
- **Detail modal** — amount header, status badge màu theo loại
- **Pagination** — page counter, disabled states

---

## 6. Admin Dashboard

### Tabs
1. **📊 Tổng quan** — Stats cards (users, GD thành công, rút chờ duyệt), revenue cards, alert banner
2. **👥 Người dùng** — Table với search, role badge, ban/unban
3. **💳 Giao dịch** — All transactions với filter type/status
4. **🏦 Rút tiền** — Pending withdrawals với approve/reject (badge đỏ trên tab)

### Stats Cards
- 3 cards màu khác nhau: blue (users), green (GD), orange (pending)
- Revenue comparison: tổng nạp vào vs rút ra

---

## 7. OTP Flow Chuẩn

### Chuyển tiền
- **≥ 500.000đ**: OTP qua email
- **< 500.000đ**: Không cần OTP

### Rút tiền
- **≥ 100.000đ**: OTP bắt buộc qua email
- **< 100.000đ**: Không cần OTP

### Luồng OTP
1. Backend gọi `sendOtp()` → lưu Redis 5 phút
2. Email gửi template đẹp với gradient header
3. Frontend hiện OTP Modal 6 ô
4. Sau verify → execute transaction
5. OTP token xóa khỏi Redis

---

## 8. Email Templates

3 loại email với màu khác nhau:
- **Xác minh email**: Gradient xanh dương `#1a56db`
- **Reset mật khẩu**: Gradient tím `#7e3af2`
- **Xác thực GD**: Gradient xanh lá `#057a55`

Features:
- OTP code box 42px font, letter-spacing 10px
- Security notice (cảnh báo không chia sẻ OTP)
- Mobile-responsive HTML email
- Expiry countdown trong email

---

## 9. Animation Spec

```css
--transition-fast: 150ms ease     /* hover, active states */
--transition-base: 250ms ease     /* tab switch, fade */
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1)  /* modal slide */
```

| Animation | Dùng cho |
|---|---|
| `slideUp` | Bottom sheet modal |
| `scaleIn + pulse` | Success icon |
| `shimmer` | Skeleton loading |
| `shake` | OTP sai |
| `scanBeam` | QR scanner beam |

---

## 10. Accessibility

- Tất cả interactive elements có unique `id` cho testing
- Color contrast ≥ 4.5:1 trên text
- Focus ring rõ ràng (3px outline)
- `aria-label` cho OTP inputs
- Keyboard navigation: Tab/Enter/Backspace trên OTP boxes
- Disable states rõ ràng (opacity 0.4)