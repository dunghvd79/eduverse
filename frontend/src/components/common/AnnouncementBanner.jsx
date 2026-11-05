import React, { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import settingsService, { ANNOUNCEMENT_TONE } from '../../services/settingsService';

const DISMISS_KEY = 'eduverse.dismissedAnnouncement';

const readDismissed = () => {
  try { return sessionStorage.getItem(DISMISS_KEY); } catch { return null; }
};

/**
 * Dải thông báo toàn hệ thống do Admin bật ở trang Cài đặt hệ thống (docs/api/api-settings.md).
 * Người dùng tắt được trong phiên hiện tại; Admin đổi nội dung thì dải hiện lại.
 */
export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    let cancelled = false;
    settingsService.getPublic()
      .then((data) => { if (!cancelled) setAnnouncement(data?.announcement || null); })
      .catch(() => {}); // Không lấy được thông báo thì thôi, không làm phiền người dùng
    return () => { cancelled = true; };
  }, []);

  if (!announcement || dismissed === announcement.message) return null;
  const [label, cls] = ANNOUNCEMENT_TONE[announcement.tone] || ANNOUNCEMENT_TONE.info;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, announcement.message); } catch { /* bỏ qua */ }
    setDismissed(announcement.message);
  };

  return (
    <div role="status" className={`flex items-start gap-3 border-b px-4 py-2.5 text-sm ${cls}`}>
      <Megaphone size={17} className="mt-0.5 flex-none" />
      <p className="m-0 flex-1"><b>{label}:</b> {announcement.message}</p>
      <button type="button" onClick={dismiss} className="flex-none rounded p-0.5 hover:bg-black/5" aria-label="Ẩn thông báo">
        <X size={16} />
      </button>
    </div>
  );
}
