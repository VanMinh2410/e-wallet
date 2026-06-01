/**
 * check-commit-message.js
 * Kiểm tra commit message theo chuẩn Conventional Commits
 * Dùng: node check-commit-message.js "feat(wallet): add transfer"
 */

const commitMsg = process.argv[2] || '';

// Đọc từ stdin nếu không có argument
const msg = commitMsg.trim().split('\n')[0]; // Chỉ lấy dòng đầu (subject)

const VALID_TYPES = [
  'feat', 'fix', 'refactor', 'test', 'docs',
  'style', 'chore', 'perf', 'ci', 'hotfix', 'revert',
];

const VALID_SCOPES = [
  'auth', 'wallet', 'transaction', 'transfer', 'topup', 'withdraw',
  'qr', 'notification', 'user', 'queue', 'socket', 'cache',
  'config', 'docker', 'db', 'ci', 'deps',
];

// Regex: <type>(<scope>): <subject>
// Scope là tùy chọn
const PATTERN = /^(\w+)(\([\w-]+\))?!?: .{1,72}$/;
const TYPE_SCOPE_PATTERN = /^(\w+)(\(([\w-]+)\))?!?:/;

function validate(message) {
  const errors = [];

  // Kiểm tra format cơ bản
  if (!PATTERN.test(message)) {
    errors.push(`Format không đúng. Chuẩn: <type>(<scope>): <subject>`);
    errors.push(`Ví dụ: feat(wallet): add transfer API`);
    return errors;
  }

  // Trích xuất type và scope
  const match = message.match(TYPE_SCOPE_PATTERN);
  if (!match) {
    errors.push('Không thể parse type/scope');
    return errors;
  }

  const [, type, , scope] = match;

  // Kiểm tra type hợp lệ
  if (!VALID_TYPES.includes(type)) {
    errors.push(`Type "${type}" không hợp lệ.`);
    errors.push(`Các type hợp lệ: ${VALID_TYPES.join(', ')}`);
  }

  // Kiểm tra scope hợp lệ (nếu có)
  if (scope && !VALID_SCOPES.includes(scope)) {
    errors.push(`Scope "${scope}" không hợp lệ.`);
    errors.push(`Các scope hợp lệ: ${VALID_SCOPES.join(', ')}`);
  }

  // Kiểm tra subject không rỗng và không kết thúc bằng dấu chấm
  const subject = message.replace(TYPE_SCOPE_PATTERN, '').trim();
  if (!subject) {
    errors.push('Subject không được rỗng');
  }
  if (subject.endsWith('.')) {
    errors.push('Subject không được kết thúc bằng dấu chấm (.)');
  }
  if (subject.charAt(0) === subject.charAt(0).toUpperCase() && subject.charAt(0) !== subject.charAt(0).toLowerCase()) {
    errors.push('Subject không được bắt đầu bằng chữ hoa');
  }

  // Kiểm tra WIP
  if (/^wip/i.test(message) || message.toLowerCase() === 'wip') {
    errors.push('Không được commit với message "WIP". Dùng git stash hoặc viết message rõ ràng.');
  }

  return errors;
}

// Chạy validation
if (!msg) {
  console.error('❌ Commit message rỗng');
  process.exit(1);
}

const errors = validate(msg);

if (errors.length > 0) {
  console.error('❌ Commit message không hợp lệ:');
  errors.forEach(err => console.error(`   - ${err}`));
  console.error('\n📖 Xem quy tắc tại: .claude/rules/commit-convention.md');
  process.exit(1);
} else {
  console.log(`✅ Commit message hợp lệ: "${msg}"`);
  process.exit(0);
}
