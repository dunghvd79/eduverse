/**
 * Unit test thống kê lớp cho các sheet Excel "Thống kê lớp" / "Tiến độ học" — utils/gradebookStats.js.
 * Không cần CSDL hay server: chạy bằng `npm test`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RANKINGS, finalScoreOf, effectiveWeights, rankingOf } from '../../src/utils/grading.js';
import {
  PASS_SCORE, PROGRESS_BUCKETS, progressStatusOf, computeClassStatistics, buildStatisticsTables, buildProgressTable
} from '../../src/utils/gradebookStats.js';

/** Dựng một dòng bảng điểm giống computeGradebook trả về (chỉ các trường thống kê cần dùng) */
const makeRow = (index, { quizzes = [], assignments = [], progress = 0, completed = 0, total = 10 }) => {
  const quizScores = quizzes.map(([quizId, score, attempted = score > 0]) => ({ quizId, score, attempted }));
  const assignmentScores = assignments.map(([assignmentId, grade, state]) => ({ assignmentId, grade, state }));
  const weights = effectiveWeights(quizzes.length > 0, assignments.length > 0);
  const finalScore = finalScoreOf({ quizScores, assignmentScores, progressPercentage: progress }, weights);
  return {
    index,
    student: { id: `s${index}`, fullName: `Học viên ${index}`, email: `hv${index}@eduverse.com` },
    completedLessons: completed,
    totalLessons: total,
    progressPercentage: progress,
    quizScores,
    assignmentScores,
    finalScore,
    ranking: rankingOf(finalScore)
  };
};

const book = {
  quizzes: [{ id: 'q1', title: 'Quiz 1' }, { id: 'q2', title: 'Quiz 2' }],
  assignments: [{ id: 'a1', title: 'Bài tập 1' }],
  rows: [
    makeRow(1, { quizzes: [['q1', 10], ['q2', 8]], assignments: [['a1', 9, 'graded']], progress: 100, completed: 10 }),
    makeRow(2, { quizzes: [['q1', 6], ['q2', 0]], assignments: [['a1', 0, 'ungraded']], progress: 50, completed: 5 }),
    makeRow(3, { quizzes: [['q1', 0], ['q2', 0]], assignments: [['a1', 0, 'missing']], progress: 0, completed: 0 }),
    makeRow(4, { quizzes: [['q1', 7], ['q2', 5]], assignments: [['a1', 6, 'regrade_pending']], progress: 80, completed: 8 })
  ]
};

describe('progressStatusOf', () => {
  it('100% → Hoàn thành, trên 0% → Đang học, 0% → Chưa bắt đầu', () => {
    assert.equal(progressStatusOf(100), 'Hoàn thành');
    assert.equal(progressStatusOf(99.99), 'Đang học');
    assert.equal(progressStatusOf(0.01), 'Đang học');
    assert.equal(progressStatusOf(0), 'Chưa bắt đầu');
  });
});

describe('computeClassStatistics — tổng quan', () => {
  const { overview } = computeClassStatistics(book);

  it('đếm học viên và tính điểm trung bình / cao nhất / thấp nhất theo điểm tổng kết từng người', () => {
    const finals = book.rows.map((r) => r.finalScore);
    assert.equal(overview.totalStudents, 4);
    assert.equal(overview.highestFinalScore, Math.max(...finals));
    assert.equal(overview.lowestFinalScore, Math.min(...finals));
    assert.equal(overview.averageFinalScore, Math.round((finals.reduce((s, v) => s + v, 0) / 4) * 100) / 100);
  });

  it('số học viên đạt = điểm tổng kết từ 5 trở lên, tỷ lệ đạt tính theo cả lớp', () => {
    assert.equal(PASS_SCORE, 5);
    const expected = book.rows.filter((r) => r.finalScore >= 5).length;
    assert.equal(overview.passedCount, expected);
    assert.equal(overview.passRate, Math.round((expected / 4) * 10000) / 100);
  });

  it('tiến độ trung bình = (100 + 50 + 0 + 80) / 4', () => {
    assert.equal(overview.averageProgress, 57.5);
  });

  it('bài tập chờ chấm = chưa chấm + nộp lại chờ chấm lại (cùng cách đếm với bảng điểm)', () => {
    assert.equal(overview.pendingGradingCount, 2);
  });

  it('trung vị của số lượng chẵn là trung bình hai điểm giữa, số lẻ là điểm giữa', () => {
    const rows = [makeRow(1, { progress: 20 }), makeRow(2, { progress: 40 }), makeRow(3, { progress: 100 })];
    const odd = computeClassStatistics({ quizzes: [], assignments: [], rows }).overview.medianFinalScore;
    assert.equal(odd, rows[1].finalScore);
    const even = computeClassStatistics({ quizzes: [], assignments: [], rows: rows.slice(0, 2) }).overview.medianFinalScore;
    assert.equal(even, Math.round(((rows[0].finalScore + rows[1].finalScore) / 2) * 100) / 100);
  });
});

describe('computeClassStatistics — phân bố xếp loại', () => {
  const { distribution } = computeClassStatistics(book);

  it('đủ 4 mức theo thứ tự Giỏi → Chưa đạt, tổng số học viên bằng sĩ số lớp', () => {
    assert.deepEqual(distribution.map((d) => d.label), RANKINGS.map((r) => r.label));
    assert.equal(distribution.reduce((s, d) => s + d.count, 0), 4);
  });

  it('số lượng từng mức khớp xếp loại của từng học viên', () => {
    for (const { label, count } of distribution) {
      assert.equal(count, book.rows.filter((r) => r.ranking === label).length);
    }
  });

  it('tỷ lệ phần trăm cộng lại xấp xỉ 100', () => {
    const total = distribution.reduce((s, d) => s + d.percent, 0);
    assert.ok(Math.abs(total - 100) < 0.05, `tổng ${total}`);
  });
});

describe('computeClassStatistics — bài kiểm tra', () => {
  const { quizzes } = computeClassStatistics(book);

  it('Quiz 1: 3/4 người đã làm, điểm TB cả lớp tính cả người chưa làm (0 điểm)', () => {
    const q1 = quizzes[0];
    assert.equal(q1.attemptedCount, 3);
    assert.equal(q1.notAttemptedCount, 1);
    assert.equal(q1.attemptRate, 75);
    assert.equal(q1.averageAll, 5.75); // (10 + 6 + 0 + 7) / 4
    assert.equal(q1.averageAttempted, 7.67); // (10 + 6 + 7) / 3
    assert.equal(q1.highest, 10);
    assert.equal(q1.lowest, 6);
  });

  it('Quiz 2: chỉ người đã làm mới có cao nhất/thấp nhất', () => {
    const q2 = quizzes[1];
    assert.equal(q2.attemptedCount, 2);
    assert.equal(q2.highest, 8);
    assert.equal(q2.lowest, 5);
  });

  it('chưa ai làm thì điểm TB người đã làm, cao nhất, thấp nhất là null', () => {
    const rows = [makeRow(1, { quizzes: [['q1', 0, false]] }), makeRow(2, { quizzes: [['q1', 0, false]] })];
    const [q] = computeClassStatistics({ quizzes: [{ id: 'q1', title: 'Q' }], assignments: [], rows }).quizzes;
    assert.equal(q.attemptedCount, 0);
    assert.equal(q.attemptRate, 0);
    assert.equal(q.averageAttempted, null);
    assert.equal(q.highest, null);
    assert.equal(q.lowest, null);
    assert.equal(q.averageAll, 0);
  });

  it('điểm 0 nhưng đã làm vẫn được tính là đã làm', () => {
    const rows = [makeRow(1, { quizzes: [['q1', 0, true]] })];
    const [q] = computeClassStatistics({ quizzes: [{ id: 'q1', title: 'Q' }], assignments: [], rows }).quizzes;
    assert.equal(q.attemptedCount, 1);
    assert.equal(q.lowest, 0);
  });
});

describe('computeClassStatistics — bài tập', () => {
  const [a1] = computeClassStatistics(book).assignments;

  it('đếm theo từng trạng thái, tổng các trạng thái bằng sĩ số', () => {
    assert.equal(a1.gradedCount, 1);
    assert.equal(a1.ungradedCount, 1);
    assert.equal(a1.regradePendingCount, 1);
    assert.equal(a1.resubmissionRequestedCount, 0);
    assert.equal(a1.missingCount, 1);
    assert.equal(
      a1.gradedCount + a1.ungradedCount + a1.regradePendingCount + a1.resubmissionRequestedCount + a1.missingCount, 4
    );
  });

  it('đã nộp = sĩ số trừ người chưa nộp; tỷ lệ nộp 75%', () => {
    assert.equal(a1.submittedCount, 3);
    assert.equal(a1.submitRate, 75);
  });

  it('điểm TB bài đã chấm chỉ tính bài có điểm thật (9 và 6); điểm TB cả lớp tính cả 0 điểm', () => {
    assert.equal(a1.averageGraded, 7.5);
    assert.equal(a1.averageAll, 3.75); // (9 + 0 + 0 + 6) / 4
  });

  it('yêu cầu nộp lại được đếm là đã nộp, không đưa vào điểm TB bài đã chấm', () => {
    const rows = [
      makeRow(1, { assignments: [['a1', 8, 'graded']] }),
      makeRow(2, { assignments: [['a1', 0, 'resubmission_requested']] })
    ];
    const [a] = computeClassStatistics({ quizzes: [], assignments: [{ id: 'a1', title: 'A' }], rows }).assignments;
    assert.equal(a.resubmissionRequestedCount, 1);
    assert.equal(a.submittedCount, 2);
    assert.equal(a.averageGraded, 8);
  });
});

describe('computeClassStatistics — phân bố tiến độ', () => {
  it('mỗi học viên rơi vào đúng một mức, ranh giới 50 / 80 / 100', () => {
    const rows = [0, 0.01, 49.99, 50, 79.99, 80, 99.99, 100].map((progress, i) => makeRow(i + 1, { progress }));
    const { progress } = computeClassStatistics({ quizzes: [], assignments: [], rows });
    assert.deepEqual(progress.map((p) => p.label), PROGRESS_BUCKETS.map((b) => b.label));
    assert.deepEqual(progress.map((p) => p.count), [1, 2, 2, 2, 1]);
    assert.equal(progress.reduce((s, p) => s + p.count, 0), rows.length);
  });
});

describe('computeClassStatistics — lớp trống (chưa có học viên)', () => {
  const stats = computeClassStatistics({
    quizzes: [{ id: 'q1', title: 'Q' }], assignments: [{ id: 'a1', title: 'A' }], rows: []
  });

  it('không chia cho 0: các giá trị trung bình là null, tỷ lệ là 0', () => {
    assert.equal(stats.overview.totalStudents, 0);
    assert.equal(stats.overview.averageFinalScore, null);
    assert.equal(stats.overview.highestFinalScore, null);
    assert.equal(stats.overview.medianFinalScore, null);
    assert.equal(stats.overview.passRate, 0);
    assert.equal(stats.quizzes[0].attemptRate, 0);
    assert.equal(stats.assignments[0].submitRate, 0);
    assert.ok(stats.distribution.every((d) => d.count === 0 && d.percent === 0));
  });

  it('dựng bảng vẫn không lỗi, giá trị thiếu hiện dấu —', () => {
    const tables = buildStatisticsTables(stats);
    assert.equal(tables[0].rows[1][1], '—');
  });
});

describe('buildStatisticsTables', () => {
  const tables = buildStatisticsTables(computeClassStatistics(book));

  it('lớp có cả Quiz và Bài tập: 5 bảng theo đúng thứ tự', () => {
    assert.deepEqual(tables.map((t) => t.title), ['Tổng quan', 'Phân bố xếp loại', 'Bài kiểm tra', 'Bài tập', 'Phân bố tiến độ học']);
  });

  it('mọi dòng có đúng số ô bằng số cột tiêu đề (không lệch cột khi xuất Excel)', () => {
    for (const table of tables) {
      for (const row of table.rows) assert.equal(row.length, table.headers.length, `${table.title}: ${row}`);
    }
  });

  it('lớp không có Quiz hoặc không có Bài tập thì bỏ bảng tương ứng', () => {
    const noQuiz = buildStatisticsTables(computeClassStatistics({ ...book, quizzes: [], rows: book.rows.map((r) => ({ ...r, quizScores: [] })) }));
    assert.ok(!noQuiz.some((t) => t.title === 'Bài kiểm tra'));
    assert.ok(noQuiz.some((t) => t.title === 'Bài tập'));
    const none = buildStatisticsTables(computeClassStatistics({ quizzes: [], assignments: [], rows: [] }));
    assert.deepEqual(none.map((t) => t.title), ['Tổng quan', 'Phân bố xếp loại', 'Phân bố tiến độ học']);
  });
});

describe('buildProgressTable', () => {
  const table = buildProgressTable(book);

  it('mỗi học viên một dòng, giữ thứ tự bảng điểm, đúng số cột', () => {
    assert.equal(table.rows.length, 4);
    assert.deepEqual(table.rows.map((r) => r[0]), [1, 2, 3, 4]);
    for (const row of table.rows) assert.equal(row.length, table.headers.length);
  });

  it('trạng thái từng người: Hoàn thành / Đang học / Chưa bắt đầu / Đang học', () => {
    assert.deepEqual(table.rows.map((r) => r.at(-1)), ['Hoàn thành', 'Đang học', 'Chưa bắt đầu', 'Đang học']);
  });

  it('có số bài đã hoàn thành, tổng số bài và phần trăm', () => {
    assert.deepEqual(table.rows[1].slice(3, 6), [5, 10, 50]);
  });
});
