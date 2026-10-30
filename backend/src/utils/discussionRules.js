/**
 * Hàm thuần (không đụng CSDL) cho quy tắc quyền và chuẩn hóa nội dung của module Thảo luận / Hỏi đáp
 * (docs/api/api-discussions.md, BR-070 → BR-078). Service chỉ việc nạp dữ liệu rồi hỏi các hàm này.
 * Có unit test: tests/unit/discussionRules.test.js.
 */

export const CONTENT_MAX_LENGTH = 2000;
export const CLASS_OPEN_STATUS = 'active';

const STAFF_ROLES = ['admin', 'training_manager'];

/** Bỏ khoảng trắng hai đầu; không phải chuỗi thì coi là rỗng. */
export const normalizeContent = (value) => (typeof value === 'string' ? value.trim() : '');

/** Nội dung hợp lệ: 1 đến 2000 ký tự sau khi bỏ khoảng trắng hai đầu. */
export const isValidContent = (value) => {
  const text = normalizeContent(value);
  return text.length >= 1 && text.length <= CONTENT_MAX_LENGTH;
};

/** Cắt ngắn nội dung để đưa vào thông báo. */
export const clipText = (value, max) => {
  const text = normalizeContent(value).replace(/\s+/g, ' ');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

/**
 * Vai trò của người xem đối với một lớp.
 *  - role: vai trò hệ thống; userId: id người xem
 *  - classTeacherId: classes.teacher_id
 *  - isActiveStudent: học viên có ghi danh `active` trong lớp (đã tra CSDL)
 * Trả về { isStaff, isClassTeacher, isActiveStudent, canView, canWriteRole }:
 *  - canView: được xem khu thảo luận của lớp (BR-070)
 *  - canWriteRole: vai trò này được đăng/sửa/trả lời (học viên của lớp hoặc giảng viên phụ trách, BR-071)
 */
export const accessOf = ({ role, userId, classTeacherId, isActiveStudent = false }) => {
  const isStaff = STAFF_ROLES.includes(role);
  const isClassTeacher = role === 'teacher' && Boolean(userId) && classTeacherId === userId;
  const isStudentMember = role === 'student' && Boolean(isActiveStudent);
  return {
    isStaff,
    isClassTeacher,
    isActiveStudent: isStudentMember,
    canView: isStaff || isClassTeacher || isStudentMember,
    canWriteRole: isClassTeacher || isStudentMember
  };
};

/** Lớp đang mở (`active`) mới cho ghi; `paused`/`closed` chỉ đọc (BR-077). */
export const isClassOpen = (classStatus) => classStatus === CLASS_OPEN_STATUS;

/**
 * Quyền của người xem trên MỘT bài thảo luận.
 *  - access: kết quả của accessOf
 *  - discussion: { authorId, parentId }  (parentId = null là câu hỏi gốc)
 *  - classStatus: classes.status
 * Học viên chỉ ghi được khi lớp `active`; giảng viên phụ trách, Quản lý, Admin luôn được xóa/đánh dấu để kiểm duyệt (BR-077).
 */
export const permissionsOf = ({ access, userId, classStatus, discussion }) => {
  const open = isClassOpen(classStatus);
  const isAuthor = Boolean(userId) && discussion.authorId === userId;
  const isRoot = discussion.parentId === null || discussion.parentId === undefined;
  const moderator = access.isStaff || access.isClassTeacher;
  const authorCanAct = isAuthor && access.canWriteRole && open;
  return {
    canEdit: authorCanAct,
    canDelete: moderator || authorCanAct,
    canResolve: isRoot && (moderator || authorCanAct)
  };
};

/** Quyền đăng bài mới / trả lời của người xem trong lớp (không phụ thuộc bài cụ thể). */
export const canPostIn = ({ access, classStatus }) => access.canWriteRole && isClassOpen(classStatus);

/**
 * Lý do bị từ chối khi ghi, để service chọn mã lỗi đúng:
 *  - 'role'   → 403 (vai trò không được đăng, ví dụ Quản lý/Admin)
 *  - 'closed' → 409 (đúng vai trò nhưng lớp đang tạm dừng / đã kết thúc)
 *  - null     → được phép
 */
export const writeDenialOf = ({ access, classStatus }) => {
  if (!access.canWriteRole) return 'role';
  if (!isClassOpen(classStatus)) return 'closed';
  return null;
};

/** Thời điểm hoạt động gần nhất của một câu hỏi: câu trả lời mới nhất, hoặc chính câu hỏi nếu chưa có trả lời. */
export const lastActivityOf = (createdAt, replyCreatedAts = []) => {
  const times = [createdAt, ...replyCreatedAts].map((v) => new Date(v).getTime()).filter((n) => Number.isFinite(n));
  return times.length > 0 ? new Date(Math.max(...times)).toISOString() : null;
};
