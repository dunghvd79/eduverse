/**
 * Điều kiện hoàn thành bài học theo loại (BR-016, docs/api/api-courses.md).
 * - theory, video: học viên tự đánh dấu.
 * - quiz, assignment: có chấm điểm nên chỉ hệ thống đánh dấu (đạt bài kiểm tra / nộp bài), học viên không tự đổi được.
 */
const SELF_COMPLETABLE_TYPES = ['theory', 'video'];

export const isSelfCompletable = (lessonType) => SELF_COMPLETABLE_TYPES.includes(lessonType);

export const autoCompletionMessageOf = (lessonType) => (lessonType === 'assignment'
  ? 'Bài tập được tính hoàn thành tự động khi bạn nộp bài, không thể tự đánh dấu.'
  : 'Bài kiểm tra được tính hoàn thành tự động khi bạn đạt điểm yêu cầu, không thể tự đánh dấu.');
