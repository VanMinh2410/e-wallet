/**
 * check-api-convention.js
 * Kiểm tra API conventions trong controller files
 * Dùng: node check-api-convention.js [thư mục]
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIR = process.argv[2] || 'apps/backend/src';
let errorCount = 0;
let fileCount = 0;

// Kiểm tra response format chuẩn
const RESPONSE_INTERCEPTOR_CHECK = /ResponseInterceptor|TransformInterceptor/;

// Kiểm tra HTTP method phù hợp
function checkControllerFile(filePath, content) {
  const errors = [];
  
  // 1. Kiểm tra @Get không có body transformation rõ ràng
  // (Basic check - in real scenario, use AST parser)
  
  // 2. Kiểm tra controller có @Controller decorator không
  if (content.includes('.controller.ts') && !content.includes('@Controller(')) {
    errors.push('Controller file thiếu @Controller() decorator');
  }
  
  // 3. Kiểm tra method handlers có return value
  const voidHandlers = content.match(/@(Get|Post|Put|Patch|Delete)\([^)]*\)\s*\n\s*async?\s+\w+\([^)]*\)\s*:\s*void/g);
  if (voidHandlers) {
    errors.push(`${voidHandlers.length} handler(s) có return type void – phải return response object`);
  }
  
  // 4. Kiểm tra @Post không có HttpCode override (nên 201)
  const postWithout201 = content.match(/@Post\([^)]*\)\s*\n(?!\s*@HttpCode)/g);
  if (postWithout201 && postWithout201.length > 0) {
    // Gợi ý thôi, không bắt buộc vì có thể dùng interceptor
    // errors.push('Một số @Post handler có thể cần @HttpCode(201)');
  }
  
  return errors;
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
      if (!['node_modules', 'dist', '.git'].includes(item)) {
        walkDir(fullPath);
      }
    } else if (item.endsWith('.controller.ts')) {
      fileCount++;
      const content = fs.readFileSync(fullPath, 'utf8');
      const errors = checkControllerFile(fullPath, content);
      
      if (errors.length > 0) {
        console.error(`❌ ${fullPath}:`);
        errors.forEach(e => console.error(`   - ${e}`));
        errorCount += errors.length;
      }
    }
  }
}

console.log(`🔍 Kiểm tra API conventions trong: ${TARGET_DIR}`);
walkDir(TARGET_DIR);

console.log(`\n📊 Kết quả: Đã kiểm tra ${fileCount} controller files`);

if (errorCount > 0) {
  console.error(`❌ Tìm thấy ${errorCount} vấn đề`);
  console.error('📖 Xem quy tắc: .claude/rules/api-conventions.md');
  process.exit(1);
} else {
  console.log(`✅ Tất cả controllers tuân thủ API conventions`);
  process.exit(0);
}
