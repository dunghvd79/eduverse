import React, { useLayoutEffect, useRef } from 'react';

/**
 * Ô nhập nhiều dòng tự giãn theo nội dung (từ `minRows` tới `maxHeight`, quá thì cuộn) và bộ đếm ký tự.
 * Dùng cho nội dung dài như mô tả khóa học; truyền mọi props khác xuống <textarea>.
 */
export default function AutoTextarea({ value = '', maxLength, minRows = 4, maxHeight = 320, invalid = false, className = '', ...props }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight + 2, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, maxHeight]);

  const length = value.length;
  const nearLimit = maxLength && length > maxLength * 0.9;

  return (
    <div>
      <textarea
        ref={ref}
        rows={minRows}
        value={value}
        maxLength={maxLength}
        aria-invalid={invalid || undefined}
        className={`w-full resize-y rounded-xl border bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-700 outline-none focus:border-[#1168bd] ${invalid ? 'border-red-400' : 'border-slate-200'} ${className}`}
        {...props}
      />
      {maxLength && (
        <small className={`mt-1 block text-right text-xs ${nearLimit ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
          {length.toLocaleString('vi-VN')}/{maxLength.toLocaleString('vi-VN')} ký tự
        </small>
      )}
    </div>
  );
}
