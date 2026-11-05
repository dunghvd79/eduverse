/**
 * Nhận diện link video bài học (YouTube, Vimeo) và tạo link nhúng trình phát.
 * Cùng quy tắc với backend/src/utils/videoUrl.js — đổi một bên thì đổi cả hai.
 */

const YOUTUBE_ID = '([A-Za-z0-9_-]{11})';
const PATTERNS = [
  { provider: 'youtube', regex: new RegExp(`^https?://(?:www\\.|m\\.)?youtube\\.com/watch\\?(?:.*&)?v=${YOUTUBE_ID}`) },
  { provider: 'youtube', regex: new RegExp(`^https?://(?:www\\.|m\\.)?youtube\\.com/(?:embed|shorts|live)/${YOUTUBE_ID}`) },
  { provider: 'youtube', regex: new RegExp(`^https?://youtu\\.be/${YOUTUBE_ID}`) },
  { provider: 'vimeo', regex: /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/ },
  { provider: 'vimeo', regex: /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/ }
];

export const VIDEO_URL_HINT = 'Dán link YouTube (youtube.com/watch?v=..., youtu.be/...) hoặc Vimeo (vimeo.com/...).';

/**
 * { provider, id, embedUrl } nếu là link YouTube/Vimeo hợp lệ, ngược lại null.
 * YouTube dùng youtube-nocookie.com (chế độ bảo mật nâng cao, không đặt cookie theo dõi trước khi phát).
 */
export const parseVideoUrl = (url) => {
  const value = String(url || '').trim();
  for (const { provider, regex } of PATTERNS) {
    const match = value.match(regex);
    if (match) {
      const id = match[1];
      const embedUrl = provider === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${id}?rel=0`
        : `https://player.vimeo.com/video/${id}`;
      return { provider, id, embedUrl };
    }
  }
  return null;
};

/** Khung nhúng trình phát (tỉ lệ 16:9) */
export function VideoEmbed({ url, title, className = '' }) {
  const video = parseVideoUrl(url);
  if (!video) return null;
  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-slate-900 aspect-video ${className}`}>
      <iframe
        src={video.embedUrl}
        title={title || 'Video bài giảng'}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
