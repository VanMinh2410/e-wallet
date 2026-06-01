# 🏷️ Quy tắc: Naming Conventions

## Backend (NestJS / TypeScript)

### Files
```
# Module files – camelCase.type.ts
wallets.module.ts
wallets.service.ts
wallets.controller.ts

# Schema – camelCase.schema.ts
wallet.schema.ts
transaction.schema.ts

# DTO – camelCase.dto.ts
transfer.dto.ts
create-wallet.dto.ts

# Guard/Strategy – camelCase.guard.ts / camelCase.strategy.ts
jwt-auth.guard.ts
jwt.strategy.ts

# Test – camelCase.spec.ts
wallets.service.spec.ts
```

### Classes
```typescript
// PascalCase cho class
class WalletService {}
class TransferDto {}
class JwtAuthGuard {}

// PascalCase cho enum
enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// PascalCase cho interface
interface WalletDocument extends Document {}
```

### Variables & Functions
```typescript
// camelCase
const walletBalance = 50000;
function calculateFee(amount: number): number {}

// SCREAMING_SNAKE_CASE cho constants
const MAX_TRANSFER_AMOUNT = 100_000_000;
const JWT_EXPIRY_MINUTES = 15;
```

### Database Collections
```
# Mongoose – PascalCase cho Schema, tự động plural lowercase khi tạo collection
class User {}       → collection: users
class Wallet {}     → collection: wallets
class Transaction {}→ collection: transactions
```

## Frontend (React / TypeScript)

### Files
```
# Component – PascalCase.tsx
LoginPage.tsx
TransferForm.tsx
BalanceCard.tsx

# Hook – use + camelCase.ts
useSocket.ts
useRefreshToken.ts
useTransferForm.ts

# Slice – camelCase + Slice.ts
authSlice.ts
walletSlice.ts

# Service/Utils – camelCase.ts
api.ts
currency.ts
formatDate.ts
```

### Components
```typescript
// PascalCase cho component
function TransferPage() {}
const BalanceCard: React.FC = () => {};

// Props – PascalCase + Props suffix
interface TransferFormProps {
  onSuccess: () => void;
  maxAmount: number;
}
```

### CSS Classes (nếu dùng CSS Modules)
```css
/* kebab-case */
.balance-card {}
.transfer-form {}
.btn-primary {}
```

## API & Socket Events

### REST Endpoints
```
# kebab-case, số nhiều
/api/v1/wallets
/api/v1/wallets/:id/transfers
/api/v1/auth/refresh-token
```

### Socket Events
```typescript
// snake_case cho socket events
'transaction_completed'
'balance_updated'
'notification_received'
```

## Git Branches
```
# Format: <type>/<scope>-<description>
feature/wallet-qr-payment
fix/auth-refresh-token-expired
hotfix/transfer-double-debit
refactor/transaction-service
chore/update-dependencies
```
