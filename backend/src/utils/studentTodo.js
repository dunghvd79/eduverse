/**
 * Hàm thuần cho "việc cần làm" và "học tiếp" của học viên (trang Tổng quan, trang Khóa học của tôi).
 * Không đụng CSDL để unit test được (tests/unit/studentTodo.test.js).
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
export const DUE_SOON_DAYS = 7;

const timeOf = (value) => new Date(value).getTime();

/**
 * Sắp đến hạn = hạn nằm trong [bây giờ, bây giờ + 7 ngày]. Hạn null (mở không giới hạn) hoặc đã qua thì không tính.
 */
export const isDueSoon = (deadline, now = new Date()) => {
  if (!deadline) return false;
  const time = timeOf(deadline);
  return time >= now.getTime() && time <= now.getTime() + DUE_SOON_DAYS * DAY_MS;
};

// Hạn null (mở không giới hạn) xếp cuối
export const byDeadline = (a, b) =>
  (a.deadline ? timeOf(a.deadline) : Infinity) - (b.deadline ? timeOf(b.deadline) : Infinity);

// Lớp chưa có hoạt động xếp cuối, giữ thứ tự ban đầu
export const byLastActiveDesc = (a, b) =>
  (b.lastActiveAt ? timeOf(b.lastActiveAt) : -Infinity) - (a.lastActiveAt ? timeOf(a.lastActiveAt) : -Infinity);

/**
 * Gom việc cần làm theo lớp: { [classId]: { todoCount, dueSoonCount, nextDeadline } }
 * nextDeadline = hạn gần nhất chưa qua (bài nộp muộn đã quá hạn không tính).
 */
export const summarizeTodoByClass = (items, now = new Date()) => items.reduce((acc, item) => {
  const summary = (acc[item.classId] ||= { todoCount: 0, dueSoonCount: 0, nextDeadline: null });
  summary.todoCount += 1;
  if (isDueSoon(item.deadline, now)) summary.dueSoonCount += 1;
  const upcoming = item.deadline && timeOf(item.deadline) >= now.getTime();
  if (upcoming && (!summary.nextDeadline || timeOf(item.deadline) < timeOf(summary.nextDeadline))) {
    summary.nextDeadline = item.deadline;
  }
  return acc;
}, {});

/**
 * Bài học tiếp theo: bài đầu tiên (theo thứ tự chương, bài) chưa hoàn thành; học hết rồi thì bài đầu tiên để xem lại.
 */
export const nextLessonIdOf = (orderedLessonIds, completedLessonIds) =>
  orderedLessonIds.find((id) => !completedLessonIds.has(id)) ?? orderedLessonIds[0] ?? null;
