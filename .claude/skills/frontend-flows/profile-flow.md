# 👤 Frontend Flow: Hồ sơ cá nhân

## Màn hình: `/profile`

## Nội dung

- Thông tin cá nhân: avatar, họ tên, email, số điện thoại
- Bảo mật: đổi mật khẩu, đăng xuất tất cả thiết bị
- Tài khoản ngân hàng liên kết
- Cài đặt thông báo

## API

```typescript
// GET /api/v1/users/me
// PATCH /api/v1/users/me
// POST /api/v1/auth/change-password
// POST /api/v1/auth/logout-all
```

## Upload Avatar

```typescript
const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  // Validate: chỉ nhận image/*, tối đa 5MB
  if (!file.type.startsWith('image/')) {
    throw new Error('Chỉ hỗ trợ file ảnh');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File không được vượt quá 5MB');
  }
  
  await api.post('/users/me/avatar', formData);
};
```
