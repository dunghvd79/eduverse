import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ClipboardCheck, FileText, RotateCcw, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import notificationService from '../../services/notificationService';

// Phase 1 dùng HTTP polling (docs/architecture/design-decisions.md): hỏi số chưa đọc mỗi 30 giây
const POLL_MS = 30000;
const LIST_LIMIT = 15;

const DEFAULT_STYLE = { icon: Bell, tone: 'bg-slate-100 text-slate-500' };
const TYPE_STYLE = {
  assignment_assigned: { icon: FileText, tone: 'bg-blue-50 text-blue-600' },
  assignment_graded: { icon: CheckCircle2, tone: 'bg-green-50 text-green-600' },
  assignment_resubmission: { icon: RotateCcw, tone: 'bg-orange-50 text-orange-600' },
  course_pending: { icon: ClipboardCheck, tone: 'bg-blue-50 text-blue-600' },
  course_approved: { icon: CheckCircle2, tone: 'bg-green-50 text-green-600' },
  course_rejected: { icon: XCircle, tone: 'bg-red-50 text-red-600' }
};

const timeAgo = (iso) => {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (!(minutes >= 1)) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
};

const clamp2 = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

/**
 * Chuông thông báo trên thanh trên cùng của portal.
 * Lỗi mạng/API được bỏ qua (chuông không được làm hỏng trang đang dùng).
 */
export default function NotificationBell() {
  const nav = useNavigate();
  const mustChangePassword = useAuthStore((state) => state.user?.mustChangePassword);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef(null);

  // Tài khoản đang dùng mật khẩu tạm bị backend chặn (403) -> không hỏi cho đến khi đổi mật khẩu
  useEffect(() => {
    if (mustChangePassword) return undefined;
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const data = await notificationService.unreadCount();
        if (!cancelled) setUnread(data.unreadCount || 0);
      } catch {
        // im lặng: lần hỏi sau sẽ thử lại
      }
    };
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [mustChangePassword]);

  // Bấm ra ngoài hoặc nhấn Esc thì đóng danh sách
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await notificationService.list({ limit: LIST_LIMIT });
      setItems(data.items || []);
      setUnread(data.unreadCount || 0);
      setHasMore(Boolean(data.meta?.hasNextPage));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const openItem = (item) => {
    setOpen(false);
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnread((count) => Math.max(0, count - 1));
      notificationService.markRead(item.id).catch(() => {});
    }
    if (item.link) nav(item.link);
  };

  const markAll = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      // giữ nguyên trạng thái, người dùng có thể bấm lại
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        onClick={toggle}
        aria-label={unread > 0 ? `Thông báo (${unread} chưa đọc)` : 'Thông báo'}
        aria-haspopup="true"
        aria-expanded={open}
        title="Thông báo"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute top-0 right-0 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ width: 'min(380px, calc(100vw - 24px))' }}
          role="dialog"
          aria-label="Danh sách thông báo"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
            <b className="text-sm text-slate-800">Thông báo{unread > 0 ? ` (${unread})` : ''}</b>
            <button
              type="button"
              className="border-0 bg-transparent text-xs font-semibold text-[#1168bd] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={markAll}
              disabled={unread === 0}
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'min(420px, calc(100vh - 160px))' }}>
            {loading && items.length === 0 && (
              <p className="m-0 px-4 py-8 text-center text-sm text-slate-500">Đang tải thông báo...</p>
            )}
            {failed && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                <p className="m-0 mb-3">Không tải được thông báo.</p>
                <button type="button" className="ui-btn secondary" onClick={loadList}>Thử lại</button>
              </div>
            )}
            {!loading && !failed && items.length === 0 && (
              <p className="m-0 px-4 py-8 text-center text-sm text-slate-500">Bạn chưa có thông báo nào.</p>
            )}
            {!failed && items.map((item) => {
              const { icon: Icon, tone } = TYPE_STYLE[item.type] || DEFAULT_STYLE;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={`w-full text-left flex gap-3 px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${item.isRead ? 'bg-white' : 'bg-[#f3f8ff]'}`}
                >
                  <span className={`flex-none w-9 h-9 rounded-full grid place-items-center ${tone}`}><Icon size={17} /></span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[13px] ${item.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>{item.title}</span>
                    <span className="block mt-0.5 text-xs leading-relaxed text-slate-500" style={clamp2}>{item.message}</span>
                    <span className="block mt-1 text-[11px] text-slate-400">{timeAgo(item.createdAt)}</span>
                  </span>
                  {!item.isRead && <span className="flex-none mt-1.5 w-2 h-2 rounded-full bg-[#1168bd]" aria-label="Chưa đọc" />}
                </button>
              );
            })}
          </div>

          {hasMore && (
            <p className="m-0 px-4 py-2 text-center text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
              Chỉ hiển thị {LIST_LIMIT} thông báo mới nhất.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
