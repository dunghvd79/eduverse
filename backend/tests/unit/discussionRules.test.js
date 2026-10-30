import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTENT_MAX_LENGTH,
  normalizeContent,
  isValidContent,
  clipText,
  accessOf,
  isClassOpen,
  permissionsOf,
  canPostIn,
  writeDenialOf,
  lastActivityOf
} from '../../src/utils/discussionRules.js';

// Quy tắc: docs/api/api-discussions.md, docs/requirements/business-rules.md (BR-070 → BR-078)

const TEACHER = 'teacher-1';
const OTHER_TEACHER = 'teacher-2';
const STUDENT = 'student-1';
const OTHER_STUDENT = 'student-2';

const accessFor = (role, userId, { isActiveStudent = false, classTeacherId = TEACHER } = {}) =>
  accessOf({ role, userId, classTeacherId, isActiveStudent });

const question = (authorId) => ({ authorId, parentId: null });
const reply = (authorId) => ({ authorId, parentId: 'q-1' });

describe('nội dung bài đăng', () => {
  test('giới hạn nội dung là 2000 ký tự', () => {
    assert.equal(CONTENT_MAX_LENGTH, 2000);
  });

  test('normalizeContent bỏ khoảng trắng hai đầu, không phải chuỗi thì thành rỗng', () => {
    assert.equal(normalizeContent('  xin chào \n'), 'xin chào');
    assert.equal(normalizeContent(null), '');
    assert.equal(normalizeContent(undefined), '');
    assert.equal(normalizeContent(123), '');
  });

  test('isValidContent: 1 đến 2000 ký tự sau khi trim', () => {
    assert.equal(isValidContent('a'), true);
    assert.equal(isValidContent('a'.repeat(2000)), true);
    assert.equal(isValidContent('a'.repeat(2001)), false);
    assert.equal(isValidContent(''), false);
    assert.equal(isValidContent('   \n\t '), false);
    assert.equal(isValidContent(`  ${'a'.repeat(2000)}  `), true);
    assert.equal(isValidContent(42), false);
  });

  test('clipText gộp khoảng trắng và cắt ngắn có dấu …', () => {
    assert.equal(clipText('  a   b\n c ', 50), 'a b c');
    assert.equal(clipText('abcdefghij', 5), 'abcd…');
    assert.equal(clipText('abcde', 5), 'abcde');
    assert.equal(clipText(null, 5), '');
  });
});

describe('accessOf: ai được xem / ghi (BR-070, BR-071)', () => {
  test('học viên đang học trong lớp: xem và ghi được', () => {
    const a = accessFor('student', STUDENT, { isActiveStudent: true });
    assert.equal(a.canView, true);
    assert.equal(a.canWriteRole, true);
    assert.equal(a.isActiveStudent, true);
    assert.equal(a.isStaff, false);
    assert.equal(a.isClassTeacher, false);
  });

  test('học viên không thuộc lớp (hoặc đã bị xóa khỏi lớp): không xem được', () => {
    const a = accessFor('student', OTHER_STUDENT, { isActiveStudent: false });
    assert.equal(a.canView, false);
    assert.equal(a.canWriteRole, false);
  });

  test('giảng viên phụ trách: xem và ghi được', () => {
    const a = accessFor('teacher', TEACHER);
    assert.equal(a.canView, true);
    assert.equal(a.canWriteRole, true);
    assert.equal(a.isClassTeacher, true);
  });

  test('giảng viên không phụ trách lớp: không xem được', () => {
    const a = accessFor('teacher', OTHER_TEACHER);
    assert.equal(a.canView, false);
    assert.equal(a.canWriteRole, false);
    assert.equal(a.isClassTeacher, false);
  });

  test('Quản lý đào tạo và Admin: xem được nhưng không đăng bài', () => {
    for (const role of ['training_manager', 'admin']) {
      const a = accessFor(role, `${role}-1`);
      assert.equal(a.isStaff, true, role);
      assert.equal(a.canView, true, role);
      assert.equal(a.canWriteRole, false, role);
    }
  });

  test('cờ isActiveStudent chỉ có nghĩa với role student', () => {
    const a = accessFor('teacher', OTHER_TEACHER, { isActiveStudent: true });
    assert.equal(a.canView, false);
    assert.equal(a.isActiveStudent, false);
  });

  test('thiếu userId thì không bao giờ là giảng viên phụ trách', () => {
    const a = accessOf({ role: 'teacher', userId: undefined, classTeacherId: undefined });
    assert.equal(a.isClassTeacher, false);
    assert.equal(a.canView, false);
  });
});

describe('trạng thái lớp (BR-077)', () => {
  test('chỉ lớp active mới mở cho ghi', () => {
    assert.equal(isClassOpen('active'), true);
    assert.equal(isClassOpen('paused'), false);
    assert.equal(isClassOpen('closed'), false);
    assert.equal(isClassOpen(undefined), false);
  });

  test('writeDenialOf: role → 403, closed → 409, null → được ghi', () => {
    const student = accessFor('student', STUDENT, { isActiveStudent: true });
    const manager = accessFor('training_manager', 'm-1');
    assert.equal(writeDenialOf({ access: student, classStatus: 'active' }), null);
    assert.equal(writeDenialOf({ access: student, classStatus: 'paused' }), 'closed');
    assert.equal(writeDenialOf({ access: student, classStatus: 'closed' }), 'closed');
    assert.equal(writeDenialOf({ access: manager, classStatus: 'active' }), 'role');
    // Sai vai trò được ưu tiên báo trước, kể cả khi lớp đã đóng
    assert.equal(writeDenialOf({ access: manager, classStatus: 'closed' }), 'role');
  });

  test('canPostIn khớp writeDenialOf', () => {
    const student = accessFor('student', STUDENT, { isActiveStudent: true });
    const teacher = accessFor('teacher', TEACHER);
    const admin = accessFor('admin', 'a-1');
    assert.equal(canPostIn({ access: student, classStatus: 'active' }), true);
    assert.equal(canPostIn({ access: teacher, classStatus: 'active' }), true);
    assert.equal(canPostIn({ access: teacher, classStatus: 'closed' }), false);
    assert.equal(canPostIn({ access: admin, classStatus: 'active' }), false);
  });
});

describe('permissionsOf: quyền trên một bài (BR-074, BR-075, BR-076)', () => {
  const student = accessFor('student', STUDENT, { isActiveStudent: true });
  const otherStudent = accessFor('student', OTHER_STUDENT, { isActiveStudent: true });
  const teacher = accessFor('teacher', TEACHER);
  const manager = accessFor('training_manager', 'm-1');
  const admin = accessFor('admin', 'a-1');

  const perms = (access, userId, classStatus, discussion) => permissionsOf({ access, userId, classStatus, discussion });

  test('tác giả học viên sửa, xóa, đánh dấu được câu hỏi của mình khi lớp active', () => {
    assert.deepEqual(perms(student, STUDENT, 'active', question(STUDENT)), { canEdit: true, canDelete: true, canResolve: true });
  });

  test('học viên khác không sửa, xóa, đánh dấu được bài của người khác', () => {
    assert.deepEqual(perms(otherStudent, OTHER_STUDENT, 'active', question(STUDENT)), { canEdit: false, canDelete: false, canResolve: false });
  });

  test('giảng viên phụ trách xóa và đánh dấu được bài của học viên nhưng không sửa hộ', () => {
    assert.deepEqual(perms(teacher, TEACHER, 'active', question(STUDENT)), { canEdit: false, canDelete: true, canResolve: true });
  });

  test('giảng viên sửa được bài của chính mình', () => {
    assert.equal(perms(teacher, TEACHER, 'active', reply(TEACHER)).canEdit, true);
  });

  test('Quản lý và Admin: xóa và đánh dấu được, không sửa được', () => {
    for (const [access, id] of [[manager, 'm-1'], [admin, 'a-1']]) {
      assert.deepEqual(perms(access, id, 'active', question(STUDENT)), { canEdit: false, canDelete: true, canResolve: true });
    }
  });

  test('câu trả lời không đánh dấu "đã giải đáp" được, dù là ai', () => {
    assert.equal(perms(student, STUDENT, 'active', reply(STUDENT)).canResolve, false);
    assert.equal(perms(teacher, TEACHER, 'active', reply(STUDENT)).canResolve, false);
    assert.equal(perms(admin, 'a-1', 'active', reply(STUDENT)).canResolve, false);
  });

  test('lớp tạm dừng hoặc kết thúc: học viên mất mọi quyền ghi trên bài của mình', () => {
    for (const status of ['paused', 'closed']) {
      assert.deepEqual(perms(student, STUDENT, status, question(STUDENT)), { canEdit: false, canDelete: false, canResolve: false }, status);
    }
  });

  test('lớp tạm dừng hoặc kết thúc: giảng viên, Quản lý, Admin vẫn xóa và đánh dấu để kiểm duyệt', () => {
    for (const status of ['paused', 'closed']) {
      assert.deepEqual(perms(teacher, TEACHER, status, question(STUDENT)), { canEdit: false, canDelete: true, canResolve: true }, status);
      assert.equal(perms(manager, 'm-1', status, question(STUDENT)).canDelete, true, status);
      assert.equal(perms(admin, 'a-1', status, question(STUDENT)).canResolve, true, status);
    }
    // Giảng viên sửa bài của chính mình cũng bị khóa khi lớp chỉ đọc
    assert.equal(perms(teacher, TEACHER, 'closed', reply(TEACHER)).canEdit, false);
  });

  test('thiếu userId: không có quyền tác giả', () => {
    const anon = accessOf({ role: 'student', userId: undefined, classTeacherId: TEACHER, isActiveStudent: true });
    assert.deepEqual(perms(anon, undefined, 'active', question(undefined)), { canEdit: false, canDelete: false, canResolve: false });
  });

  test('parentId undefined được coi là câu hỏi gốc', () => {
    assert.equal(perms(teacher, TEACHER, 'active', { authorId: STUDENT }).canResolve, true);
  });
});

describe('lastActivityOf', () => {
  test('chưa có câu trả lời: lấy thời điểm đăng câu hỏi', () => {
    assert.equal(lastActivityOf('2026-10-25T03:00:00.000Z'), '2026-10-25T03:00:00.000Z');
  });

  test('có trả lời: lấy thời điểm mới nhất, bất kể thứ tự', () => {
    assert.equal(
      lastActivityOf('2026-10-25T03:00:00.000Z', ['2026-10-25T05:00:00.000Z', '2026-10-25T04:00:00.000Z']),
      '2026-10-25T05:00:00.000Z'
    );
  });

  test('nhận được cả đối tượng Date', () => {
    assert.equal(lastActivityOf(new Date('2026-10-25T03:00:00.000Z'), [new Date('2026-10-26T01:00:00.000Z')]), '2026-10-26T01:00:00.000Z');
  });

  test('giá trị không hợp lệ bị bỏ qua; toàn bộ không hợp lệ thì trả null', () => {
    assert.equal(lastActivityOf('2026-10-25T03:00:00.000Z', ['không phải ngày']), '2026-10-25T03:00:00.000Z');
    assert.equal(lastActivityOf('không phải ngày'), null);
  });
});
