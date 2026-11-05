import test from 'node:test';
import assert from 'node:assert/strict';
import { geminiModelsOf } from '../../src/services/aiService.js';

test('mặc định có model chính rồi các model dự phòng theo thứ tự', () => {
  assert.deepEqual(geminiModelsOf({}), ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest']);
});

test('GEMINI_FALLBACK_MODEL nhận nhiều model, bỏ khoảng trắng và model trùng', () => {
  assert.deepEqual(geminiModelsOf({ GEMINI_MODEL: 'a', GEMINI_FALLBACK_MODEL: 'b, c ,a' }), ['a', 'b', 'c']);
});

test('GEMINI_FALLBACK_MODEL rỗng thì tắt dự phòng', () => {
  assert.deepEqual(geminiModelsOf({ GEMINI_MODEL: 'a', GEMINI_FALLBACK_MODEL: '' }), ['a']);
});
