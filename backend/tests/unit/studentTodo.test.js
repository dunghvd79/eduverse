/**
 * Unit test hàm thuần cho "việc cần làm" và "học tiếp" của học viên (src/utils/studentTodo.js).
 * Dùng cho trang Tổng quan và trang Khóa học của tôi (GET /classes/my-classes). Không cần CSDL: `npm test`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_MS, isDueSoon, byDeadline, byLastActiveDesc, summarizeTodoByClass, nextLessonIdOf
} from '../../src/utils/studentTodo.js';

const NOW = new Date('2026-10-30T08:00:00Z');
const inDays = (days) => new Date(NOW.getTime() + days * DAY_MS).toISOString();

describe('isDueSoon — hạn trong 7 ngày tới', () => {
  it('hạn trong khoảng [bây giờ, +7 ngày] → sắp đến hạn', () => {
    assert.equal(isDueSoon(inDays(0), NOW), true);
    assert.equal(isDueSoon(inDays(3), NOW), true);
    assert.equal(isDueSoon(inDays(7), NOW), true);
  });

  it('hạn đã qua, xa hơn 7 ngày hoặc không có hạn → không tính', () => {
    assert.equal(isDueSoon(inDays(-0.01), NOW), false);
    assert.equal(isDueSoon(inDays(7.01), NOW), false);
    assert.equal(isDueSoon(null, NOW), false);
  });
});

describe('byDeadline / byLastActiveDesc — sắp xếp', () => {
  it('hạn gần trước, không có hạn xếp cuối', () => {
    const items = [{ deadline: null }, { deadline: inDays(5) }, { deadline: inDays(1) }];
    assert.deepEqual(items.sort(byDeadline).map((i) => i.deadline), [inDays(1), inDays(5), null]);
  });

  it('học gần nhất trước, chưa học xếp cuối và giữ thứ tự ban đầu', () => {
    const items = [
      { id: 'a', lastActiveAt: null },
      { id: 'b', lastActiveAt: inDays(-5) },
      { id: 'c', lastActiveAt: null },
      { id: 'd', lastActiveAt: inDays(-1) }
    ];
    assert.deepEqual(items.sort(byLastActiveDesc).map((i) => i.id), ['d', 'b', 'a', 'c']);
  });
});

describe('summarizeTodoByClass — gom việc cần làm theo lớp', () => {
  it('đếm tổng việc, việc sắp đến hạn và hạn gần nhất chưa qua của từng lớp', () => {
    const summary = summarizeTodoByClass([
      { classId: 'L1', deadline: inDays(2) },
      { classId: 'L1', deadline: inDays(1) },
      { classId: 'L1', deadline: inDays(10) },
      { classId: 'L1', deadline: null },
      { classId: 'L2', deadline: inDays(-1) }
    ], NOW);
    assert.deepEqual(summary.L1, { todoCount: 4, dueSoonCount: 2, nextDeadline: inDays(1) });
    // Bài nộp muộn đã quá hạn: vẫn là việc cần làm nhưng không có hạn sắp tới
    assert.deepEqual(summary.L2, { todoCount: 1, dueSoonCount: 0, nextDeadline: null });
  });

  it('không có việc → object rỗng', () => {
    assert.deepEqual(summarizeTodoByClass([], NOW), {});
  });
});

describe('nextLessonIdOf — bài học tiếp theo', () => {
  const ordered = ['b1', 'b2', 'b3'];

  it('bài đầu tiên chưa hoàn thành theo thứ tự đề cương', () => {
    assert.equal(nextLessonIdOf(ordered, new Set()), 'b1');
    assert.equal(nextLessonIdOf(ordered, new Set(['b1', 'b3'])), 'b2');
  });

  it('học hết → bài đầu tiên (xem lại); khóa không có bài → null', () => {
    assert.equal(nextLessonIdOf(ordered, new Set(ordered)), 'b1');
    assert.equal(nextLessonIdOf([], new Set()), null);
  });
});
