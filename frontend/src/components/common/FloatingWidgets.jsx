import React from 'react';

export default function FloatingWidgets() {
  return (
    <aside className="fixed right-3 bottom-24 z-30 flex flex-col gap-2.5 items-end">
      {/* Dictionary Widget */}
      <a
        className="w-11 h-11 bg-white hover:bg-sky-50 text-primary rounded-xl shadow-lg border border-slate-200 flex flex-col items-center justify-center transition-transform hover:-translate-x-1"
        href="#dictionary"
        title="Tra nhanh từ điển"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <span className="text-[9px] font-semibold text-slate-600">Từ điển</span>
      </a>

      {/* Messenger Button */}
      <a
        className="w-11 h-11 bg-white hover:bg-blue-50 text-blue-600 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center transition-transform hover:-translate-x-1"
        href="https://m.me/eduverse"
        target="_blank"
        rel="noopener noreferrer"
        title="Hỗ trợ Facebook Messenger"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.729 7.185V22l3.414-1.874c.907.251 1.868.388 2.857.388 5.523 0 10-4.145 10-9.255C22 6.145 17.523 2 12 2zm1.042 12.445l-2.663-2.84-5.2 2.84 5.72-6.071 2.73 2.84 5.132-2.84-5.719 6.071z" />
        </svg>
      </a>

      {/* Zalo Support */}
      <a
        className="w-11 h-11 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center transition-transform hover:-translate-x-1"
        href="https://zalo.me/eduverse"
        target="_blank"
        rel="noopener noreferrer"
        title="Tư vấn Zalo"
      >
        Zalo
      </a>
    </aside>
  );
}
