/**
 * Wrapper: chạy seed từ thư mục gốc repo
 * Khuyến nghị: cd backend && npm run seed
 */
const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');
execSync('npm run seed', { cwd: backendDir, stdio: 'inherit' });
