# 📜 Backend Flow: Lịch sử Giao dịch

## Endpoint

```
GET /api/v1/transactions
Authorization: Bearer <token>
Query: page, limit, type, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder
```

## Implementation

```typescript
// transactions.controller.ts
@Get()
@UseGuards(JwtAuthGuard)
async getHistory(
  @User() user: JwtPayload,
  @Query() query: TransactionQueryDto,
) {
  return this.transactionsService.getHistory(user.userId, query);
}

// transactions.service.ts
async getHistory(userId: string, query: TransactionQueryDto) {
  const wallet = await this.walletModel.findOne({ userId }).lean();
  
  const filter: FilterQuery<Transaction> = {
    $or: [
      { fromWalletId: wallet._id },
      { toWalletId: wallet._id },
    ],
  };
  
  if (query.type && query.type !== 'ALL') {
    filter.type = query.type;
  }
  if (query.startDate) {
    filter.createdAt = { $gte: new Date(query.startDate) };
  }
  if (query.endDate) {
    filter.createdAt = { ...filter.createdAt, $lte: new Date(query.endDate) };
  }
  
  const [items, total] = await Promise.all([
    this.transactionModel
      .find(filter)
      .sort({ [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('fromWalletId', 'userId')
      .lean(),
    this.transactionModel.countDocuments(filter),
  ]);
  
  return {
    items,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
```

## Query DTO

```typescript
export class TransactionQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsEnum(['ALL', 'TRANSFER', 'TOPUP', 'WITHDRAW'])
  type?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

## Performance

- Index: `{ fromWalletId: 1, createdAt: -1 }` và `{ toWalletId: 1, createdAt: -1 }`
- Cache trang 1 (30 giây) với Redis
- Invalidate cache khi có transaction mới
