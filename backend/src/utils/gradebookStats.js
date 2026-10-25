/**
 * Hàm thuần (không đụng CSDL) tính thống kê lớp từ bảng điểm do gradebookService.computeGradebook trả về,
 * dùng cho các sheet "Thống kê lớp" và "Tiến độ học" của file Excel (gradebookExportService.js, UC-GRADE-003, UC-PROGRESS-003).
 * Có unit test: tests/unit/gradebookStats.test.js.
 */
import { RANKINGS, round2, average } from './grading.js';

/** Điểm tổng kết từ mức này trở lên là "đạt" (cận dưới của xếp loại Trung bình, grading-policy.md mục 3) */
export const PASS_SCORE = 5;

/** Các mức tiến độ học, xét theo % bài học đã hoàn thành */
export const PROGRESS_BUCKETS = [
  { label: 'Chưa bắt đầu (0%)', matches: (p) => p <= 0 },
  { label: 'Dưới 50%', matches: (p) => p > 0 && p < 50 },
  { label: '50% đến dưới 80%', matches: (p) => p >= 50 && p < 80 },
  { label: '80% đến dưới 100%', matches: (p) => p >= 80 && p < 100 },
  { label: 'Hoàn thành (100%)', matches: (p) => p >= 100 }
];

const percentOf = (count, total) => (total ? round2((count / total) * 100) : 0);
const maxOf = (values) => (values.length ? Math.max(...values) : null);
const minOf = (values) => (values.length ? Math.min(...values) : null);
const averageOrNull = (values) => (values.length ? round2(average(values)) : null);

const medianOf = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return round2(sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
};

/** Tiến độ của một học viên: Hoàn thành / Đang học / Chưa bắt đầu (UC-PROGRESS-003) */
export const progressStatusOf = (progressPercentage) => {
  if (progressPercentage >= 100) return 'Hoàn thành';
  if (progressPercentage > 0) return 'Đang học';
  return 'Chưa bắt đầu';
};

/**
 * Thống kê cả lớp.
 * book: { quizzes: [{id, title}], assignments: [{id, title}], rows: [{ progressPercentage, quizScores, assignmentScores, finalScore, ranking }] }
 */
export const computeClassStatistics = (book) => {
  const { rows } = book;
  const total = rows.length;
  const finals = rows.map((r) => r.finalScore);

  const overview = {
    totalStudents: total,
    averageFinalScore: averageOrNull(finals),
    highestFinalScore: maxOf(finals),
    lowestFinalScore: minOf(finals),
    medianFinalScore: medianOf(finals),
    passedCount: finals.filter((score) => score >= PASS_SCORE).length,
    averageProgress: averageOrNull(rows.map((r) => r.progressPercentage)),
    pendingGradingCount: rows.reduce(
      (sum, r) => sum + r.assignmentScores.filter((a) => a.state === 'ungraded' || a.state === 'regrade_pending').length, 0
    )
  };
  overview.passRate = percentOf(overview.passedCount, total);

  const distribution = RANKINGS.map(({ label }) => {
    const count = rows.filter((r) => r.ranking === label).length;
    return { label, count, percent: percentOf(count, total) };
  });

  const quizzes = book.quizzes.map((quiz) => {
    const entries = rows.map((r) => r.quizScores.find((q) => q.quizId === quiz.id)).filter(Boolean);
    const attempted = entries.filter((e) => e.attempted);
    const attemptedScores = attempted.map((e) => e.score);
    return {
      id: quiz.id,
      title: quiz.title,
      attemptedCount: attempted.length,
      notAttemptedCount: total - attempted.length,
      attemptRate: percentOf(attempted.length, total),
      averageAll: averageOrNull(entries.map((e) => e.score)),
      averageAttempted: averageOrNull(attemptedScores),
      highest: maxOf(attemptedScores),
      lowest: minOf(attemptedScores)
    };
  });

  const assignments = book.assignments.map((assignment) => {
    const entries = rows.map((r) => r.assignmentScores.find((a) => a.assignmentId === assignment.id)).filter(Boolean);
    const countOf = (state) => entries.filter((e) => e.state === state).length;
    const missingCount = countOf('missing');
    // Chỉ các bài có điểm do giảng viên chấm thật (đã chấm, hoặc đã nộp lại sau lần chấm) mới đưa vào điểm TB bài đã chấm
    const gradedGrades = entries.filter((e) => e.state === 'graded' || e.state === 'regrade_pending').map((e) => e.grade);
    return {
      id: assignment.id,
      title: assignment.title,
      submittedCount: total - missingCount,
      missingCount,
      gradedCount: countOf('graded'),
      ungradedCount: countOf('ungraded'),
      regradePendingCount: countOf('regrade_pending'),
      resubmissionRequestedCount: countOf('resubmission_requested'),
      submitRate: percentOf(total - missingCount, total),
      averageGraded: averageOrNull(gradedGrades),
      averageAll: averageOrNull(entries.map((e) => e.grade))
    };
  });

  const progress = PROGRESS_BUCKETS.map(({ label, matches }) => {
    const count = rows.filter((r) => matches(r.progressPercentage)).length;
    return { label, count, percent: percentOf(count, total) };
  });

  return { overview, distribution, quizzes, assignments, progress };
};

const show = (value, fallback = '—') => (value === null || value === undefined ? fallback : value);

/**
 * Các bảng của sheet "Thống kê lớp": [{ title, headers, rows }], bảng nào không có dữ liệu (lớp không có Quiz/Bài tập) thì bỏ.
 */
export const buildStatisticsTables = (stats) => {
  const { overview } = stats;
  const tables = [
    {
      title: 'Tổng quan',
      headers: ['Chỉ số', 'Giá trị'],
      rows: [
        ['Số học viên đang học', overview.totalStudents],
        ['Điểm tổng kết trung bình', show(overview.averageFinalScore)],
        ['Điểm tổng kết cao nhất', show(overview.highestFinalScore)],
        ['Điểm tổng kết thấp nhất', show(overview.lowestFinalScore)],
        ['Điểm tổng kết trung vị', show(overview.medianFinalScore)],
        [`Số học viên đạt (từ ${PASS_SCORE} điểm)`, overview.passedCount],
        ['Tỷ lệ đạt (%)', overview.passRate],
        ['Tiến độ học trung bình (%)', show(overview.averageProgress)],
        ['Bài tập đang chờ chấm', overview.pendingGradingCount]
      ]
    },
    {
      title: 'Phân bố xếp loại',
      headers: ['Xếp loại', 'Số học viên', 'Tỷ lệ (%)'],
      rows: stats.distribution.map((d) => [d.label, d.count, d.percent])
    }
  ];

  if (stats.quizzes.length) {
    tables.push({
      title: 'Bài kiểm tra',
      headers: [
        'Bài kiểm tra', 'Đã làm', 'Chưa làm', 'Tỷ lệ làm bài (%)',
        'Điểm TB cả lớp', 'Điểm TB người đã làm', 'Cao nhất', 'Thấp nhất'
      ],
      rows: stats.quizzes.map((q) => [
        q.title, q.attemptedCount, q.notAttemptedCount, q.attemptRate,
        show(q.averageAll), show(q.averageAttempted), show(q.highest), show(q.lowest)
      ])
    });
  }

  if (stats.assignments.length) {
    tables.push({
      title: 'Bài tập',
      headers: [
        'Bài tập', 'Đã nộp', 'Chưa nộp', 'Đã chấm', 'Chờ chấm', 'Nộp lại chờ chấm lại', 'Yêu cầu nộp lại',
        'Tỷ lệ nộp (%)', 'Điểm TB bài đã chấm', 'Điểm TB cả lớp'
      ],
      rows: stats.assignments.map((a) => [
        a.title, a.submittedCount, a.missingCount, a.gradedCount, a.ungradedCount, a.regradePendingCount,
        a.resubmissionRequestedCount, a.submitRate, show(a.averageGraded), show(a.averageAll)
      ])
    });
  }

  tables.push({
    title: 'Phân bố tiến độ học',
    headers: ['Mức tiến độ', 'Số học viên', 'Tỷ lệ (%)'],
    rows: stats.progress.map((p) => [p.label, p.count, p.percent])
  });

  return tables;
};

/**
 * Bảng của sheet "Tiến độ học": mỗi học viên một dòng (giữ thứ tự của bảng điểm).
 */
export const buildProgressTable = (book) => ({
  headers: ['STT', 'Họ và tên', 'Email', 'Bài học đã hoàn thành', 'Tổng số bài học', 'Tiến độ (%)', 'Trạng thái'],
  rows: book.rows.map((r) => [
    r.index, r.student.fullName, r.student.email, r.completedLessons, r.totalLessons, r.progressPercentage,
    progressStatusOf(r.progressPercentage)
  ])
});
