import React, { useState, useEffect } from 'react';

export default function FloatingWidgets() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showDictModal, setShowDictModal] = useState(false);
  const [dictQuery, setDictQuery] = useState('');
  const [dictResult, setDictResult] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sampleDict = {
    achieve: { ipa: '/əˈtʃiːv/', pos: 'v.', def: 'Đạt được, giành được (mục tiêu, thành quả qua nỗ lực)', ex: 'She achieved band 8.0 in IELTS.' },
    strategy: { ipa: '/ˈstrætədʒi/', pos: 'n.', def: 'Chiến lược, phương pháp dài hạn có kế hoạch', ex: 'Exam preparation strategy is essential.' },
    comprehensive: { ipa: '/ˌkɑːmprɪˈhensɪv/', pos: 'adj.', def: 'Toàn diện, bao hàm đầy đủ mọi khía cạnh', ex: 'EduVerse provides a comprehensive learning platform.' },
    perseverance: { ipa: '/ˌpɜːrsəˈvɪrəns/', pos: 'n.', def: 'Sự kiên trì, bền bỉ vượt khó khăn', ex: 'Perseverance is key to academic success.' },
  };

  const handleDictSearch = (e) => {
    e.preventDefault();
    const q = dictQuery.trim().toLowerCase();
    if (!q) return;
    if (sampleDict[q]) {
      setDictResult({ word: q, ...sampleDict[q] });
    } else {
      setDictResult({
        word: q,
        ipa: '/.../',
        pos: 'tra cứu trực tuyến',
        def: `Từ khóa "${q}" đã sẵn sàng tra cứu sâu trong từ điển Cambridge & Laban.`,
        ex: `Xem đầy đủ ngữ cảnh sử dụng và collocations của "${q}".`,
      });
    }
  };

  return (
    <>
      <aside className="fixed right-3 bottom-20 z-40 flex flex-col gap-2.5 items-end">
        {/* Dictionary Widget */}
        <button
          onClick={() => setShowDictModal(true)}
          className="w-11 h-11 bg-white hover:bg-sky-50 text-primary rounded-xl shadow-lg border border-slate-200 flex flex-col items-center justify-center transition-transform hover:-translate-x-1 cursor-pointer"
          title="Tra nhanh từ điển (Anh - Việt)"
          type="button"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          <span className="text-[9px] font-semibold text-slate-700">Từ điển</span>
        </button>

        {/* Messenger Button */}
        <a
          className="w-11 h-11 bg-white hover:bg-blue-50 text-blue-600 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center transition-transform hover:-translate-x-1"
          href="https://m.me/eduverse"
          target="_blank"
          rel="noopener noreferrer"
          title="Hỗ trợ Facebook Messenger"
        >
          <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.729 7.185V22l3.414-1.874c.907.251 1.868.388 2.857.388 5.523 0 10-4.145 10-9.255C22 6.145 17.523 2 12 2zm1.042 12.445l-2.663-2.84-5.2 2.84 5.72-6.071 2.73 2.84 5.132-2.84-5.719 6.071z" />
          </svg>
        </a>

        {/* Zalo Support */}
        <a
          className="w-11 h-11 bg-[#0068ff] hover:bg-[#0052cc] text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center transition-transform hover:-translate-x-1"
          href="https://zalo.me/eduverse"
          target="_blank"
          rel="noopener noreferrer"
          title="Tư vấn Zalo"
        >
          Zalo
        </a>

        {/* Scroll To Top (Study4 Elevator Style) */}
        {showScrollTop && (
          <button
            onClick={handleScrollToTop}
            className="w-11 h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-center transition-all hover:-translate-y-1 cursor-pointer animate-fade-in"
            title="Lên đầu trang"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
          </button>
        )}
      </aside>

      {/* Quick Dictionary Modal */}
      {showDictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
            <div className="px-5 py-4 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Tra nhanh từ điển EduVerse</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Anh - Việt</span>
              </div>
              <button
                onClick={() => setShowDictModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition text-white"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <form onSubmit={handleDictSearch} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nhập từ vựng tiếng Anh (e.g. achieve, strategy)..."
                  value={dictQuery}
                  onChange={(e) => setDictQuery(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition"
                >
                  Tra từ
                </button>
              </form>

              {dictResult ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-slate-900 capitalize">{dictResult.word}</span>
                    <span className="text-xs text-primary font-mono">{dictResult.ipa}</span>
                    <span className="text-xs text-slate-500 italic">({dictResult.pos})</span>
                  </div>
                  <p className="text-slate-800 font-medium text-xs sm:text-sm">{dictResult.def}</p>
                  <p className="text-slate-500 text-xs italic bg-white p-2.5 rounded border border-slate-200/60">
                    "{dictResult.ex}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Nhập từ bất kỳ để tra cứu định nghĩa, phát âm IPA và câu ví dụ chuẩn format đề thi.
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Gợi ý: <button type="button" onClick={() => { setDictQuery('strategy'); setDictResult({ word: 'strategy', ...sampleDict['strategy'] }); }} className="text-primary hover:underline font-medium">strategy</button>, <button type="button" onClick={() => { setDictQuery('achieve'); setDictResult({ word: 'achieve', ...sampleDict['achieve'] }); }} className="text-primary hover:underline font-medium">achieve</button></span>
                <span className="text-slate-400">Tích hợp Dictation 1-chạm</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
