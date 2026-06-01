# ⚠️ Quy tắc: Error Handling

## 1. Response Format Lỗi Chuẩn

```typescript
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;         // Message thân thiện cho user
  error: {
    code: string;          // Error code cho frontend xử lý
    details?: any;         // Chi tiết bổ sung (validation errors, v.v.)
  };
}
```

**Ví dụ:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Số dư không đủ để thực hiện giao dịch",
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "details": {
      "required": 100000,
      "available": 50000
    }
  }
}
```

## 2. Exception Filter Toàn cục

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = 500;
    let message = 'Lỗi hệ thống, vui lòng thử lại sau';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      // Xử lý message...
    }

    // KHÔNG log stack trace ra production response
    // CHỈ log nội bộ
    this.logger.error('Exception:', exception);

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error: { code: errorCode },
    });
  }
}
```

## 3. Custom Business Exceptions

```typescript
// Tạo exception riêng cho từng loại lỗi nghiệp vụ
export class InsufficientBalanceException extends HttpException {
  constructor(required: number, available: number) {
    super(
      {
        message: 'Số dư không đủ để thực hiện giao dịch',
        error: {
          code: 'INSUFFICIENT_BALANCE',
          details: { required, available },
        },
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

// Dùng trong service
if (wallet.balance < amount) {
  throw new InsufficientBalanceException(amount, wallet.balance);
}
```

## 4. Xử lý Transaction Error

```typescript
try {
  session.startTransaction();
  // ... thao tác
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  
  // Phân biệt loại lỗi
  if (error instanceof MongoError && error.code === 11000) {
    throw new ConflictException('Giao dịch trùng lặp');
  }
  if (error instanceof HttpException) {
    throw error; // Re-throw business exception
  }
  
  // Log lỗi không xác định
  this.logger.error('Transaction failed:', error);
  throw new InternalServerErrorException('Giao dịch thất bại, vui lòng thử lại');
} finally {
  session.endSession();
}
```

## 5. Logging Chuẩn

```typescript
// Logger trong service
private readonly logger = new Logger(WalletService.name);

// Khi thao tác thành công
this.logger.log(`Transfer success: ${fromWalletId} → ${toWalletId}, amount: ${amount}, txId: ${tx._id}`);

// Khi có lỗi
this.logger.error(`Transfer failed: user=${userId}, amount=${amount}`, error.stack);

// Không log thông tin nhạy cảm
// ❌ this.logger.log(`User password: ${password}`);
// ✅ this.logger.log(`User ${userId} logged in`);
```

## 6. Frontend Error Handling

```typescript
// Xử lý lỗi API trong React Query
const { mutate: transfer } = useMutation({
  mutationFn: transferApi,
  onError: (error: ApiError) => {
    const code = error.response?.data?.error?.code;
    
    switch (code) {
      case 'INSUFFICIENT_BALANCE':
        toast.error('Số dư không đủ');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        toast.error('Bạn đã gửi quá nhiều yêu cầu, vui lòng chờ');
        break;
      default:
        toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  }
});
```

## 7. Unhandled Promise Rejection

```typescript
// Trong NestJS main.ts
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  // KHÔNG process.exit() – để NestJS xử lý gracefully
});
```

## 8. Điều quan trọng nhớ mãi
- **KHÔNG** để lộ stack trace ra client trong production
- **KHÔNG** trả về message lỗi DB (ví dụ: "MongoServerError: E11000 duplicate key")
- **LUÔN** log đầy đủ nội bộ (userId, requestId, action)
- **LUÔN** rollback transaction khi có exception
- **LUÔN** trả về message thân thiện bằng tiếng Việt cho user
