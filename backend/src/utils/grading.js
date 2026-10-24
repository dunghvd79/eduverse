/**
 * Hàm thuần (không đụng CSDL) tính điểm tổng kết theo docs/requirements/grading-policy.md (BR-034 → BR-039).
 * Tách riêng khỏi gradebookService.js để kiểm thử tự động không cần CSDL (tests/unit/grading.test.js).
 *
 *   Tổng kết = 0.4 × Q + 0.5 × A + 0.1 × P   (thang 10, làm tròn 2 chữ số)
 */
export const BASE_WEIGHTS = { quiz: 0.4, assignment: 0.5, progress: 0.1 };

export const RANKINGS = [
  { min: 8, label: 'Giỏi' },
  { min: 6.5, label: 'Khá' },
  { min: 5, label: 'Trung bình' },
  { min: -Infinity, label: 'Chưa đạt' }
];

export const round2 = (value) => Math.round(value * 100) / 100;
export const average = (values) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null);
export const rankingOf = (score) => RANKINGS.find((r) => score >= r.min).label;

/**
 * Tỷ trọng thực tế sau khi bỏ thành phần không có (E1)
 */
export const effectiveWeights = (hasQuiz, hasAssignment) => {
  // Thứ tự khóa cố định Quiz -> Bài tập -> Tiến độ để công thức hiển thị/xuất file nhất quán
  const used = {};
  if (hasQuiz) used.quiz = BASE_WEIGHTS.quiz;
  if (hasAssignment) used.assignment = BASE_WEIGHTS.assignment;
  used.progress = BASE_WEIGHTS.progress;
  const total = Object.values(used).reduce((s, w) => s + w, 0);
  return Object.fromEntries(Object.entries(used).map(([k, w]) => [k, round2(w / total * 10000) / 10000]));
};

/**
 * Trạng thái của một bài tập đối với 1 học viên, từ bản ghi nộp bài (submission, có thể undefined khi chưa nộp):
 *   missing                - chưa nộp (tính 0)
 *   resubmission_requested - GV yêu cầu nộp lại (E3: dùng điểm lần chấm gần nhất nếu có)
 *   graded                 - đã chấm và chưa nộp lại sau đó
 *   regrade_pending        - nộp lại sau lần chấm: dùng điểm cũ (E3)
 *   ungraded               - đã nộp chưa chấm: tạm tính 0 (E2)
 */
export const assignmentStateOf = (s) => {
  let state = 'missing';
  if (s?.status === 'resubmission_requested') state = 'resubmission_requested';
  else if (s && s.grade !== null && !(s.graded_at && new Date(s.submitted_at) > new Date(s.graded_at))) state = 'graded';
  else if (s && s.grade !== null) state = 'regrade_pending';
  else if (s) state = 'ungraded';
  return state;
};

/**
 * Điểm tính vào tổng kết của một bài tập: điểm GV đã chấm, chưa nộp/chưa chấm = 0
 */
export const assignmentGradeOf = (s) => (s?.grade !== null && s?.grade !== undefined ? Number(s.grade) : 0);

/**
 * Điểm tổng kết từ điểm từng bài kiểm tra (quizScores[].score), từng bài tập (assignmentScores[].grade) và % tiến độ.
 * Tính trên giá trị chưa làm tròn để không lệch do làm tròn 2 lần, chỉ làm tròn kết quả cuối.
 */
export const finalScoreOf = ({ quizScores, assignmentScores, progressPercentage }, weights) => {
  const raw = (weights.quiz ? weights.quiz * average(quizScores.map((q) => q.score)) : 0)
    + (weights.assignment ? weights.assignment * average(assignmentScores.map((a) => a.grade)) : 0)
    + weights.progress * (progressPercentage / 10);
  return round2(raw);
};
