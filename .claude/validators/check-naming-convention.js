/**
 * check-naming-convention.js
 * Kiểm tra naming convention cho các file trong dự án
 * Dùng: node check-naming-convention.js [thư mục] (mặc định: apps/)
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIR = process.argv[2] || 'apps';
let errorCount = 0;
let checkCount = 0;

// Quy tắc naming theo loại file
const RULES = {
  // Backend NestJS
  module: { pattern: /^[a-z][a-z-]*\.module\.ts$/, example: 'wallet.module.ts' },
  service: { pattern: /^[a-z][a-z-]*\.service\.ts$/, example: 'wallet.service.ts' },
  controller: { pattern: /^[a-z][a-z-]*\.controller\.ts$/, example: 'wallet.controller.ts' },
  schema: { pattern: /^[a-z][a-z-]*\.schema\.ts$/, example: 'wallet.schema.ts' },
  dto: { pattern: /^[a-z][a-z-]*\.dto\.ts$/, example: 'transfer.dto.ts' },
  guard: { pattern: /^[a-z][a-z-]*\.guard\.ts$/, example: 'jwt-auth.guard.ts' },
  strategy: { pattern: /^[a-z][a-z-]*\.strategy\.ts$/, example: 'jwt.strategy.ts' },
  filter: { pattern: /^[a-z][a-z-]*\.filter\.ts$/, example: 'http-exception.filter.ts' },
  interceptor: { pattern: /^[a-z][a-z-]*\.interceptor\.ts$/, example: 'response.interceptor.ts' },
  spec: { pattern: /^[a-z][a-z-]*\.(service|controller|gateway)\.spec\.ts$/, example: 'wallet.service.spec.ts' },
  
  // Frontend React
  component: { pattern: /^[A-Z][a-zA-Z]*\.(tsx|jsx)$/, example: 'TransferPage.tsx' },
  hook: { pattern: /^use[A-Z][a-zA-Z]*\.ts$/, example: 'useSocket.ts' },
  slice: { pattern: /^[a-z][a-zA-Z]*Slice\.ts$/, example: 'walletSlice.ts' },
};

function getFileType(filename) {
  if (filename.endsWith('.module.ts')) return 'module';
  if (filename.endsWith('.service.ts')) return 'service';
  if (filename.endsWith('.controller.ts')) return 'controller';
  if (filename.endsWith('.schema.ts')) return 'schema';
  if (filename.endsWith('.dto.ts')) return 'dto';
  if (filename.endsWith('.guard.ts')) return 'guard';
  if (filename.endsWith('.strategy.ts')) return 'strategy';
  if (filename.endsWith('.filter.ts')) return 'filter';
  if (filename.endsWith('.interceptor.ts')) return 'interceptor';
  if (filename.endsWith('.spec.ts')) return 'spec';
  if (filename.startsWith('use') && filename.endsWith('.ts')) return 'hook';
  if (filename.endsWith('Slice.ts')) return 'slice';
  if (/^[A-Z].*\.(tsx|jsx)$/.test(filename)) return 'component';
  return null;
}

function checkFile(filePath) {
  const filename = path.basename(filePath);
  const fileType = getFileType(filename);
  
  if (!fileType || !RULES[fileType]) return;
  
  checkCount++;
  const rule = RULES[fileType];
  
  if (!rule.pattern.test(filename)) {
    console.error(`❌ Sai naming [${fileType}]: ${filePath}`);
    console.error(`   Chuẩn: ${rule.example}`);
    errorCount++;
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️  Thư mục không tồn tại: ${dir}`);
    return;
  }

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Bỏ qua node_modules, dist, .git
      if (!['node_modules', 'dist', '.git', 'coverage'].includes(item)) {
        walkDir(fullPath);
      }
    } else {
      checkFile(fullPath);
    }
  }
}

console.log(`🔍 Kiểm tra naming convention trong: ${TARGET_DIR}`);
walkDir(TARGET_DIR);

console.log(`\n📊 Kết quả: Đã kiểm tra ${checkCount} files`);

if (errorCount > 0) {
  console.error(`❌ Tìm thấy ${errorCount} lỗi naming convention`);
  console.error('📖 Xem quy tắc: .claude/rules/naming-conventions.md');
  process.exit(1);
} else {
  console.log(`✅ Tất cả ${checkCount} files tuân thủ naming convention`);
  process.exit(0);
}
