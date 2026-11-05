/**
 * Quy tắc thuần cho Nhật ký hệ thống (UC-ADMIN-005, docs/api/api-audit-logs.md). Không đụng CSDL để unit test được.
 */

export const AUDIT_CATEGORIES = {
  auth: 'Xác thực',
  user: 'Quản trị người dùng',
  course: 'Kiểm duyệt khóa học',
  class: 'Lớp học',
  grade: 'Điểm số',
  system: 'Cài đặt hệ thống'
};

export const AUDIT_SEVERITIES = ['info', 'warning', 'danger'];
export const AUDIT_STATUSES = ['success', 'failure'];

// Danh mục hành động: nhóm, mức độ mặc định, nhãn tiếng Việt hiển thị cho Admin
export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: { category: 'auth', severity: 'info', label: 'Đăng nhập thành công' },
  LOGIN_FAILED: { category: 'auth', severity: 'warning', label: 'Đăng nhập thất bại' },
  PASSWORD_CHANGED: { category: 'auth', severity: 'info', label: 'Đổi mật khẩu' },
  PASSWORD_RESET: { category: 'auth', severity: 'warning', label: 'Đặt lại mật khẩu qua email' },
  USER_CREATED: { category: 'user', severity: 'info', label: 'Tạo tài khoản' },
  USER_UPDATED: { category: 'user', severity: 'info', label: 'Sửa thông tin tài khoản' },
  USER_ROLE_CHANGED: { category: 'user', severity: 'warning', label: 'Đổi vai trò' },
  USER_BLOCKED: { category: 'user', severity: 'warning', label: 'Khóa tài khoản' },
  USER_UNBLOCKED: { category: 'user', severity: 'info', label: 'Mở khóa tài khoản' },
  USER_PASSWORD_RESET: { category: 'user', severity: 'warning', label: 'Admin cấp lại mật khẩu' },
  USER_DELETED: { category: 'user', severity: 'danger', label: 'Xóa tài khoản' },
  COURSE_APPROVED: { category: 'course', severity: 'info', label: 'Duyệt khóa học' },
  COURSE_REJECTED: { category: 'course', severity: 'info', label: 'Từ chối khóa học' },
  COURSE_UNPUBLISHED: { category: 'course', severity: 'warning', label: 'Chuyển khóa học về bản nháp' },
  COURSE_DELETED: { category: 'course', severity: 'warning', label: 'Xóa khóa học' },
  CLASS_DELETED: { category: 'class', severity: 'warning', label: 'Xóa lớp học' },
  GRADE_MODIFIED: { category: 'grade', severity: 'warning', label: 'Sửa điểm đã chấm' },
  SETTING_CHANGED: { category: 'system', severity: 'warning', label: 'Đổi cài đặt hệ thống' }
};

/**
 * Dò mật khẩu (luồng phụ UC-ADMIN-005): từ lần đăng nhập sai thứ 10 trong 5 phút của cùng một IP -> mức danger.
 */
export const BRUTE_FORCE = { windowMinutes: 5, threshold: 10 };
export const severityOfFailedLogin = (failuresInWindow) =>
  (failuresInWindow >= BRUTE_FORCE.threshold ? 'danger' : AUDIT_ACTIONS.LOGIN_FAILED.severity);

/**
 * IP hiển thị gọn: bỏ tiền tố IPv4-mapped của IPv6 ("::ffff:1.2.3.4" -> "1.2.3.4"), "::1" -> "127.0.0.1".
 */
export const normalizeIp = (ip) => {
  if (!ip) return null;
  let value = String(ip).trim();
  if (value.toLowerCase().startsWith('::ffff:') && value.includes('.')) value = value.slice(7);
  if (value === '::1') value = '127.0.0.1';
  return value.slice(0, 64) || null;
};

/**
 * Điểm đã chấm bị đổi: trả { before, after } khi điểm cũ khác điểm mới; chấm lần đầu (chưa có điểm) trả null.
 * DECIMAL từ Postgres là chuỗi -> so sánh bằng Number().
 */
export const gradeChangeOf = (previousGrade, nextGrade) => {
  if (previousGrade === null || previousGrade === undefined || nextGrade === null || nextGrade === undefined) return null;
  const before = Number(previousGrade);
  const after = Number(nextGrade);
  return before === after ? null : { before, after };
};

// CSV: bọc ô có dấu phẩy, nháy kép hoặc xuống dòng; chặn công thức Excel (CSV injection) bằng dấu nháy đơn
export const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  let text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
