/**
 * Unit test công thức tính điểm tổng kết — docs/requirements/grading-policy.md (BR-034 → BR-039, E1-E3).
 * Không cần CSDL hay server: chạy bằng `npm test` (bộ test có sẵn của Node, không cài thêm thư viện).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_WEIGHTS, RANKINGS, round2, average, rankingOf, effectiveWeights,
  assignmentStateOf, assignmentGradeOf, finalScoreOf
} from '../../src/utils/grading.js';

const close = (actual, expected, epsilon = 1e-5) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${actual} khác ${expected} quá ${epsilon}`);

describe('Tỷ trọng cơ bản (mục 1, quyết định 1)', () => {
  it('Quiz 40% · Bài tập 50% · Tiến độ 10%', () => {
    assert.deepEqual(BASE_WEIGHTS, { quiz: 0.4, assignment: 0.5, progress: 0.1 });
  });
});

describe('effectiveWeights — E1: bỏ thành phần không có và chia lại tỷ trọng', () => {
  it('có cả Quiz và Bài tập: giữ nguyên 0.4 / 0.5 / 0.1', () => {
    assert.deepEqual(effectiveWeights(true, true), { quiz: 0.4, assignment: 0.5, progress: 0.1 });
  });

  it('không có Bài tập: Quiz 0.8, Tiến độ 0.2', () => {
    const w = effectiveWeights(true, false);
    assert.deepEqual(Object.keys(w), ['quiz', 'progress']);
    close(w.quiz, 0.8);
    close(w.progress, 0.2);
  });

  it('không có Quiz: Bài tập 5/6, Tiến độ 1/6', () => {
    const w = effectiveWeights(false, true);
    assert.deepEqual(Object.keys(w), ['assignment', 'progress']);
    close(w.assignment, 5 / 6);
    close(w.progress, 1 / 6);
  });

  it('không có cả hai: chỉ còn Tiến độ 100%', () => {
    assert.deepEqual(effectiveWeights(false, false), { progress: 1 });
  });

  it('mọi tổ hợp đều có tổng tỷ trọng bằng 1', () => {
    for (const hasQuiz of [true, false]) {
      for (const hasAssignment of [true, false]) {
        const total = Object.values(effectiveWeights(hasQuiz, hasAssignment)).reduce((s, w) => s + w, 0);
        close(total, 1, 1e-4);
      }
    }
  });

  it('thứ tự khóa luôn là Quiz → Bài tập → Tiến độ', () => {
    assert.deepEqual(Object.keys(effectiveWeights(true, true)), ['quiz', 'assignment', 'progress']);
  });
});

describe('rankingOf — ngưỡng xếp loại (mục 3)', () => {
  const cases = [
    [10, 'Giỏi'], [8, 'Giỏi'], [7.99, 'Khá'], [6.5, 'Khá'], [6.49, 'Trung bình'],
    [5, 'Trung bình'], [4.99, 'Chưa đạt'], [0, 'Chưa đạt']
  ];
  for (const [score, label] of cases) {
    it(`${score} → ${label}`, () => assert.equal(rankingOf(score), label));
  }

  it('có đúng 4 mức xếp loại, mức thấp nhất không có cận dưới', () => {
    assert.deepEqual(RANKINGS.map((r) => r.label), ['Giỏi', 'Khá', 'Trung bình', 'Chưa đạt']);
    assert.equal(RANKINGS.at(-1).min, -Infinity);
  });
});

describe('round2 và average', () => {
  it('làm tròn 2 chữ số: 8.333 → 8.33, 8.335 → 8.34', () => {
    assert.equal(round2(8.333), 8.33);
    assert.equal(round2(8.336), 8.34);
  });

  it('trung bình của danh sách rỗng là null (thành phần không có)', () => {
    assert.equal(average([]), null);
    assert.equal(average([6, 8]), 7);
  });
});

describe('assignmentStateOf / assignmentGradeOf — E2, E3', () => {
  const submitted = '2026-10-10T08:00:00Z';
  const graded = '2026-10-11T08:00:00Z';
  const resubmitted = '2026-10-12T08:00:00Z';

  it('chưa nộp → missing, tính 0', () => {
    assert.equal(assignmentStateOf(undefined), 'missing');
    assert.equal(assignmentGradeOf(undefined), 0);
  });

  it('E2: đã nộp nhưng GV chưa chấm → ungraded, tạm tính 0', () => {
    const s = { status: 'submitted', grade: null, submitted_at: submitted, graded_at: null };
    assert.equal(assignmentStateOf(s), 'ungraded');
    assert.equal(assignmentGradeOf(s), 0);
  });

  it('đã chấm, chưa nộp lại → graded, dùng điểm đã chấm (kể cả điểm lưu dạng chuỗi)', () => {
    const s = { status: 'graded', grade: '8.5', submitted_at: submitted, graded_at: graded };
    assert.equal(assignmentStateOf(s), 'graded');
    assert.equal(assignmentGradeOf(s), 8.5);
  });

  it('điểm 0 đã chấm khác với chưa chấm: vẫn là graded', () => {
    const s = { status: 'graded', grade: 0, submitted_at: submitted, graded_at: graded };
    assert.equal(assignmentStateOf(s), 'graded');
  });

  it('E3: nộp lại sau lần chấm → regrade_pending, dùng điểm lần chấm gần nhất', () => {
    const s = { status: 'submitted', grade: 7, submitted_at: resubmitted, graded_at: graded };
    assert.equal(assignmentStateOf(s), 'regrade_pending');
    assert.equal(assignmentGradeOf(s), 7);
  });

  it('E3: GV yêu cầu nộp lại → resubmission_requested, giữ điểm lần chấm gần nhất', () => {
    const s = { status: 'resubmission_requested', grade: 6, submitted_at: submitted, graded_at: graded };
    assert.equal(assignmentStateOf(s), 'resubmission_requested');
    assert.equal(assignmentGradeOf(s), 6);
  });

  it('E3: yêu cầu nộp lại nhưng chưa từng chấm → tính 0', () => {
    const s = { status: 'resubmission_requested', grade: null, submitted_at: submitted, graded_at: null };
    assert.equal(assignmentGradeOf(s), 0);
  });
});

describe('finalScoreOf — điểm tổng kết', () => {
  const quiz = (...scores) => scores.map((score) => ({ score }));
  const assign = (...grades) => grades.map((grade) => ({ grade }));

  it('ví dụ minh họa trong tài liệu (mục 4): 3 quiz, 2 bài tập, 16/20 bài học → 6.87, Khá', () => {
    const score = finalScoreOf(
      { quizScores: quiz(8.5, 7, 0), assignmentScores: assign(9, 7), progressPercentage: (16 / 20) * 100 },
      effectiveWeights(true, true)
    );
    assert.equal(score, 6.87);
    assert.equal(rankingOf(score), 'Khá');
  });

  it('E1 — không có Bài tập: 0.8 × Q + 0.2 × P', () => {
    // Q = (8 + 6) / 2 = 7, P = 50% → 5  →  0.8 × 7 + 0.2 × 5 = 6.6
    const score = finalScoreOf(
      { quizScores: quiz(8, 6), assignmentScores: [], progressPercentage: 50 },
      effectiveWeights(true, false)
    );
    assert.equal(score, 6.6);
  });

  it('E1 — không có Quiz: (5/6) × A + (1/6) × P', () => {
    // A = 9, P = 60% → 6  →  7.5 + 1 = 8.5
    const score = finalScoreOf(
      { quizScores: [], assignmentScores: assign(9), progressPercentage: 60 },
      effectiveWeights(false, true)
    );
    assert.equal(score, 8.5);
  });

  it('E1 — không có Quiz lẫn Bài tập: điểm tổng kết chính là điểm tiến độ', () => {
    const score = finalScoreOf(
      { quizScores: [], assignmentScores: [], progressPercentage: 80 },
      effectiveWeights(false, false)
    );
    assert.equal(score, 8);
  });

  it('chưa làm / chưa nộp / chưa học gì → 0 điểm, Chưa đạt', () => {
    const score = finalScoreOf(
      { quizScores: quiz(0, 0), assignmentScores: assign(0), progressPercentage: 0 },
      effectiveWeights(true, true)
    );
    assert.equal(score, 0);
    assert.equal(rankingOf(score), 'Chưa đạt');
  });

  it('điểm tối đa mọi thành phần → 10, Giỏi', () => {
    const score = finalScoreOf(
      { quizScores: quiz(10, 10), assignmentScores: assign(10), progressPercentage: 100 },
      effectiveWeights(true, true)
    );
    assert.equal(score, 10);
    assert.equal(rankingOf(score), 'Giỏi');
  });

  it('bài chưa làm vẫn nằm trong mẫu số (quyết định 4)', () => {
    const withMissing = finalScoreOf(
      { quizScores: quiz(10, 0), assignmentScores: [], progressPercentage: 0 },
      effectiveWeights(true, false)
    );
    const withoutMissing = finalScoreOf(
      { quizScores: quiz(10), assignmentScores: [], progressPercentage: 0 },
      effectiveWeights(true, false)
    );
    assert.equal(withMissing, 4); // 0.8 × 5
    assert.equal(withoutMissing, 8); // 0.8 × 10
  });

  it('tính trên giá trị chưa làm tròn rồi mới làm tròn kết quả cuối', () => {
    // Q = 22/3 = 7.3333…, A = 0, P = 0 → 0.4 × 7.3333… = 2.9333… → 2.93
    const score = finalScoreOf(
      { quizScores: quiz(10, 10, 2), assignmentScores: assign(0), progressPercentage: 0 },
      effectiveWeights(true, true)
    );
    assert.equal(score, 2.93);
  });
});

describe('Tính chất của điểm tổng kết (kiểm thử ngẫu nhiên có seed cố định)', () => {
  // Bộ sinh số giả ngẫu nhiên có seed để kết quả lặp lại được giữa các lần chạy
  const makeRandom = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const random = makeRandom(20261022);
  const score10 = () => Math.round(random() * 1000) / 100;
  const list = (max, make) => Array.from({ length: 1 + Math.floor(random() * max) }, make);

  it('điểm tổng kết luôn nằm trong [0, 10] và xếp loại khớp ngưỡng', () => {
    for (let i = 0; i < 2000; i += 1) {
      const hasQuiz = random() < 0.7;
      const hasAssignment = random() < 0.7;
      const total = finalScoreOf({
        quizScores: hasQuiz ? list(5, () => ({ score: score10() })) : [],
        assignmentScores: hasAssignment ? list(5, () => ({ grade: score10() })) : [],
        progressPercentage: Math.round(random() * 10000) / 100
      }, effectiveWeights(hasQuiz, hasAssignment));

      assert.ok(total >= 0 && total <= 10, `điểm ${total} ngoài thang 10`);
      const label = rankingOf(total);
      if (total >= 8) assert.equal(label, 'Giỏi');
      else if (total >= 6.5) assert.equal(label, 'Khá');
      else if (total >= 5) assert.equal(label, 'Trung bình');
      else assert.equal(label, 'Chưa đạt');
    }
  });

  it('tăng điểm của một thành phần không bao giờ làm giảm điểm tổng kết', () => {
    for (let i = 0; i < 1000; i += 1) {
      const quizScores = list(4, () => ({ score: score10() }));
      const assignmentScores = list(4, () => ({ grade: score10() }));
      const progressPercentage = Math.round(random() * 10000) / 100;
      const weights = effectiveWeights(true, true);

      const base = finalScoreOf({ quizScores, assignmentScores, progressPercentage }, weights);
      const betterQuiz = finalScoreOf({
        quizScores: quizScores.map((q) => ({ score: Math.min(10, q.score + 1) })), assignmentScores, progressPercentage
      }, weights);
      const betterAssignment = finalScoreOf({
        quizScores, assignmentScores: assignmentScores.map((a) => ({ grade: Math.min(10, a.grade + 1) })), progressPercentage
      }, weights);
      const betterProgress = finalScoreOf({
        quizScores, assignmentScores, progressPercentage: Math.min(100, progressPercentage + 10)
      }, weights);

      assert.ok(betterQuiz >= base && betterAssignment >= base && betterProgress >= base);
    }
  });
});
