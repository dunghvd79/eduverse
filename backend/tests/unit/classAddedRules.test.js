import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CLASS_ADDED_TYPE, buildClassAddedNotice } from '../../src/utils/classAddedRules.js';

// Nội dung thông báo trong chuông khi học viên được thêm vào lớp (BR-022)

const input = { classId: 'c1', className: 'Lập trình Web K45', courseTitle: 'Lập trình Web', addedByName: 'Nguyễn Văn An' };

describe('buildClassAddedNotice', () => {
  test('loại thông báo và đường dẫn tới trang lớp của học viên', () => {
    const notice = buildClassAddedNotice(input);
    assert.equal(notice.type, 'class_member_added');
    assert.equal(CLASS_ADDED_TYPE, 'class_member_added');
    assert.equal(notice.link, '/student/classes/c1');
  });

  test('tiêu đề có tên lớp, nội dung có người thêm, tên lớp và khóa học', () => {
    const notice = buildClassAddedNotice(input);
    assert.equal(notice.title, 'Bạn đã được thêm vào lớp: Lập trình Web K45');
    assert.match(notice.message, /Nguyễn Văn An đã thêm bạn vào lớp "Lập trình Web K45" của khóa học "Lập trình Web"/);
  });

  test('thiếu khóa học thì bỏ vế khóa học, thiếu người thêm thì gọi là Giảng viên', () => {
    const notice = buildClassAddedNotice({ classId: 'c1', className: 'Lớp A' });
    assert.match(notice.message, /^Giảng viên đã thêm bạn vào lớp "Lớp A"\./);
    assert.doesNotMatch(notice.message, /khóa học/);
  });

  test('thiếu tên lớp vẫn dựng được nội dung', () => {
    const notice = buildClassAddedNotice({ classId: 'c1' });
    assert.equal(notice.title, 'Bạn đã được thêm vào lớp: lớp học');
  });

  test('xuống dòng và khoảng trắng thừa trong tên được gộp lại', () => {
    const notice = buildClassAddedNotice({ ...input, className: '  Lớp \n  A\t' });
    assert.equal(notice.title, 'Bạn đã được thêm vào lớp: Lớp A');
    assert.match(notice.message, /vào lớp "Lớp A"/);
  });
});
