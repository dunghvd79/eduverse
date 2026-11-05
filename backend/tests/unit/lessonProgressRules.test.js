/**
 * Unit test điều kiện hoàn thành bài học (src/utils/lessonProgressRules.js) — BR-016. Không cần CSDL: `npm test`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSelfCompletable, autoCompletionMessageOf } from '../../src/utils/lessonProgressRules.js';

describe('isSelfCompletable — học viên có được tự đánh dấu không', () => {
  it('lý thuyết và video: được', () => {
    assert.equal(isSelfCompletable('theory'), true);
    assert.equal(isSelfCompletable('video'), true);
  });
  it('quiz và bài tập có chấm điểm: không được', () => {
    assert.equal(isSelfCompletable('quiz'), false);
    assert.equal(isSelfCompletable('assignment'), false);
  });
  it('loại lạ hoặc thiếu: không được (mặc định an toàn)', () => {
    assert.equal(isSelfCompletable('khac'), false);
    assert.equal(isSelfCompletable(undefined), false);
  });
});

describe('autoCompletionMessageOf — thông báo khi bị chặn', () => {
  it('nêu đúng điều kiện của từng loại', () => {
    assert.match(autoCompletionMessageOf('quiz'), /đạt điểm yêu cầu/);
    assert.match(autoCompletionMessageOf('assignment'), /nộp bài/);
  });
});
