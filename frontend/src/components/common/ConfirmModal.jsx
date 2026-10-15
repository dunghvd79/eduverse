import React, { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { AlertTriangle, Trash2, HelpCircle, CheckCircle2, X } from 'lucide-react';

export const useConfirmModalStore = create((set) => ({
  isOpen: false,
  title: 'Xác nhận',
  message: '',
  subtext: '',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy bỏ',
  type: 'warning', // 'warning' | 'danger' | 'info' | 'success'
  resolve: null,

  open: (options) =>
    set({
      isOpen: true,
      title: options.title || 'Xác nhận',
      message: options.message || '',
      subtext: options.subtext || '',
      confirmText: options.confirmText || 'Xác nhận',
      cancelText: options.cancelText || 'Hủy bỏ',
      type: options.type || 'warning',
      resolve: options.resolve || null
    }),

  close: (result = false) =>
    set((state) => {
      if (state.resolve) {
        state.resolve(result);
      }
      return { isOpen: false, resolve: null };
    })
}));

/**
 * Hàm gọi hộp thoại xác nhận hiện đại (Promise-based)
 * Thay thế hoàn toàn cho window.confirm xấu xí của trình duyệt!
 *
 * @example
 * const ok = await confirmModal({
 *   title: 'Chuyển về Bản nháp?',
 *   message: 'Khóa học sẽ tạm ẩn khỏi trang chủ đối với học viên mới.',
 *   confirmText: 'Chuyển về nháp',
 *   cancelText: 'Hủy',
 *   type: 'warning' // 'warning' | 'danger' | 'info'
 * });
 * if (!ok) return;
 */
export const confirmModal = (options = {}) => {
  return new Promise((resolve) => {
    useConfirmModalStore.getState().open({
      ...options,
      resolve
    });
  });
};

const TYPE_CONFIG = {
  danger: {
    icon: Trash2,
    badgeBg: 'bg-rose-100 text-rose-600 ring-8 ring-rose-50/70',
    buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200 focus:ring-rose-500'
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: 'bg-amber-100 text-amber-600 ring-8 ring-amber-50/70',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-200 focus:ring-amber-500'
  },
  info: {
    icon: HelpCircle,
    badgeBg: 'bg-blue-100 text-[#1168bd] ring-8 ring-blue-50/70',
    buttonBg: 'bg-[#1168bd] hover:bg-[#0e5aa5] text-white shadow-sm shadow-blue-200 focus:ring-blue-500'
  },
  success: {
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50/70',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 focus:ring-emerald-500'
  }
};

export default function ConfirmModal() {
  const { isOpen, title, message, subtext, confirmText, cancelText, type, close } = useConfirmModalStore();
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Tự động focus nút xác nhận để người dùng có thể bấm Enter tiện lợi
    setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const currentType = TYPE_CONFIG[type] || TYPE_CONFIG.warning;
  const IconComponent = currentType.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={() => close(false)}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng góc phải */}
        <button
          type="button"
          onClick={() => close(false)}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title="Đóng (Esc)"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          {/* Icon Badge */}
          <div className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl ${currentType.badgeBg}`}>
            <IconComponent size={22} />
          </div>

          {/* Tiêu đề & Nội dung */}
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="m-0 text-base md:text-lg font-bold text-slate-900">
              {title}
            </h3>
            <div className="mt-2 text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {message}
            </div>

            {subtext && (
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-[11px] md:text-xs text-slate-500 leading-relaxed">
                {subtext}
              </div>
            )}
          </div>
        </div>

        {/* Nút Thao tác */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => close(true)}
            className={`rounded-xl px-5 py-2.5 text-xs md:text-sm font-bold transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentType.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
