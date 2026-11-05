/**
 * Nhận diện link video bài học (YouTube, Vimeo) để nhúng trình phát trong trang học.
 * Cùng quy tắc với frontend/src/utils/video.js — đổi một bên thì đổi cả hai.
 */

const YOUTUBE_ID = '([A-Za-z0-9_-]{11})';
const PATTERNS = [
  { provider: 'youtube', regex: new RegExp(`^https?://(?:www\\.|m\\.)?youtube\\.com/watch\\?(?:.*&)?v=${YOUTUBE_ID}`) },
  { provider: 'youtube', regex: new RegExp(`^https?://(?:www\\.|m\\.)?youtube\\.com/(?:embed|shorts|live)/${YOUTUBE_ID}`) },
  { provider: 'youtube', regex: new RegExp(`^https?://youtu\\.be/${YOUTUBE_ID}`) },
  { provider: 'vimeo', regex: /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/ },
  { provider: 'vimeo', regex: /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/ }
];

/**
 * { provider, id } nếu là link YouTube/Vimeo hợp lệ, ngược lại null
 */
export const parseVideoUrl = (url) => {
  const value = String(url || '').trim();
  for (const { provider, regex } of PATTERNS) {
    const match = value.match(regex);
    if (match) return { provider, id: match[1] };
  }
  return null;
};

export const isSupportedVideoUrl = (url) => parseVideoUrl(url) !== null;
