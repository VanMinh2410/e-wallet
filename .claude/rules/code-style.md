# 🎨 Quy tắc: Code Style

## TypeScript

### Strict Mode
```json
// tsconfig.json – bắt buộc
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Không dùng `any`
```typescript
// ❌ Sai
function processData(data: any) {}

// ✅ Đúng
function processData(data: TransactionData) {}
// Hoặc nếu thực sự unknown:
function processData(data: unknown) {
  if (typeof data === 'string') { ... }
}
```

### Import Order (ESLint)
```typescript
// 1. Node built-ins
import { join } from 'path';

// 2. External packages
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// 3. Internal modules (alias)
import { WalletService } from '@/modules/wallets/wallet.service';

// 4. Relative imports
import { TransferDto } from './dto/transfer.dto';
```

## ESLint & Prettier

### ESLint Rules Bắt buộc
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Config
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## React (Frontend)

### Component Pattern
```typescript
// Functional component với TypeScript – chuẩn
interface TransferCardProps {
  amount: number;
  recipient: string;
  onConfirm: () => void;
}

export function TransferCard({ amount, recipient, onConfirm }: TransferCardProps) {
  return (
    <div className="transfer-card">
      {/* JSX */}
    </div>
  );
}

// Default export chỉ cho page-level component
export default TransferPage;
```

### Hooks Order (React)
```typescript
function TransferPage() {
  // 1. State hooks
  const [amount, setAmount] = useState(0);

  // 2. Redux / Query hooks
  const { data: wallet } = useWallet();
  const { mutate: transfer } = useTransfer();

  // 3. Custom hooks
  const { socket } = useSocket();

  // 4. Effect hooks
  useEffect(() => {}, []);

  // 5. Event handlers
  const handleSubmit = () => {};

  // 6. Render
  return <></>;
}
```

## Formatting Rules

- **Indent**: 2 spaces (không dùng tab)
- **Max line length**: 100 ký tự
- **Trailing comma**: có (dễ diff hơn trong git)
- **Semicolon**: có
- **Quotes**: single quote (backend), double quote (JSX attribute)
- **Blank lines**: tối đa 1 dòng trống liên tiếp
