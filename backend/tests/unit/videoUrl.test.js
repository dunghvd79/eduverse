/**
 * Unit test nhận diện link video bài học (src/utils/videoUrl.js). Không cần CSDL: `npm test`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseVideoUrl, isSupportedVideoUrl } from '../../src/utils/videoUrl.js';

describe('parseVideoUrl — YouTube', () => {
  const id = 'qwPvkhemvHA';
  it('nhận các dạng link YouTube phổ biến', () => {
    for (const url of [
      `https://www.youtube.com/watch?v=${id}`,
      `https://youtube.com/watch?v=${id}&t=42s`,
      `https://www.youtube.com/watch?list=PL123&v=${id}`,
      `https://m.youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}?si=abc`,
      `https://www.youtube.com/embed/${id}`,
      `https://www.youtube.com/shorts/${id}`
    ]) {
      assert.deepEqual(parseVideoUrl(url), { provider: 'youtube', id }, url);
    }
  });
});

describe('parseVideoUrl — Vimeo', () => {
  it('nhận vimeo.com/<số> và player.vimeo.com/video/<số>', () => {
    assert.deepEqual(parseVideoUrl('https://vimeo.com/76979871'), { provider: 'vimeo', id: '76979871' });
    assert.deepEqual(parseVideoUrl('https://player.vimeo.com/video/76979871'), { provider: 'vimeo', id: '76979871' });
  });
});

describe('isSupportedVideoUrl — từ chối link khác', () => {
  it('link không phải YouTube/Vimeo, thiếu mã video hoặc rỗng -> false', () => {
    for (const url of ['https://example.com/a.mp4', 'https://www.youtube.com/', 'https://youtu.be/short', 'javascript:alert(1)', '', null]) {
      assert.equal(isSupportedVideoUrl(url), false, String(url));
    }
  });
  it('tên miền giả mạo không qua được', () => {
    assert.equal(isSupportedVideoUrl('https://youtube.com.evil.com/watch?v=qwPvkhemvHA'), false);
    assert.equal(isSupportedVideoUrl('https://evilyoutu.be/qwPvkhemvHA'), false);
  });
});
