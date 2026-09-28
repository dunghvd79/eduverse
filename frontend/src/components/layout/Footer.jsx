import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
          {/* EduVerse Info Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <svg className="h-9 w-auto" fill="none" viewBox="0 0 170 48" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#1168bd" height="40" rx="10" width="40" x="4" y="4" />
                <path d="M14 26L24 16L34 26M24 16V32" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                <circle cx="24" cy="14" fill="#38bdf8" r="2.5" />
                <text fill="#ffffff" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="800" letterSpacing="-0.5" x="54" y="32">
                  Edu<tspan fill="#38bdf8">Verse</tspan>
                </text>
              </svg>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Nền tảng công nghệ giáo dục trực tuyến chất lượng cao, định vị Tiếng Anh mũi nhọn kết hợp toàn diện chương trình THPT Lớp 10 - 11 - 12 và Luyện thi Đại học hàng đầu Việt Nam.
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>Hotline hỗ trợ: <strong className="text-slate-300">1900 8866 (8:00 - 22:00)</strong></p>
              <p>Email: <a className="hover:text-sky-400 transition" href="mailto:contact@eduverse.vn">contact@eduverse.vn</a></p>
            </div>
          </div>

          {/* Links Col 1: Tiếng Anh */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Tiếng Anh</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link className="hover:text-white transition" to="/courses?subject=ielts">Luyện thi IELTS Academic &amp; General</Link></li>
              <li><Link className="hover:text-white transition" to="/courses?subject=toeic">Luyện thi TOEIC 2 &amp; 4 Kỹ năng</Link></li>
              <li><Link className="hover:text-white transition" to="/courses?subject=thpt-english">Tiếng Anh THPT Chuyên sâu</Link></li>
              <li><Link className="hover:text-white transition" to="/courses?subject=communication">Tiếng Anh Giao tiếp &amp; Phát âm</Link></li>
              <li><Link className="hover:text-white transition" to="/courses?subject=flashcard">Bộ từ vựng Flashcards &amp; AI Speaking</Link></li>
            </ul>
          </div>

          {/* Links Col 2: THPT & Luyện thi ĐH */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">THPT &amp; ĐGNL</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link className="hover:text-white transition" to="/courses?grade=10-12-math">Toán học Lớp 10 - 11 - 12</Link></li>
              <li><Link className="hover:text-white transition" to="/courses?grade=literature">Ngữ văn &amp; Đọc hiểu nâng cao</Link></li>
              <li><Link className="hover:text-white transition" to="/courses?grade=science">Vật lý - Hóa học - Sinh học</Link></li>
              <li><Link className="hover:text-white transition" to="/courses?exam=thpt-qg">Luyện thi Tốt nghiệp THPT Quốc gia</Link></li>
              <li><Link className="hover:text-white transition" to="/courses?exam=dgnl">Luyện đề Đánh giá Năng lực (HSA, APT)</Link></li>
            </ul>
          </div>

          {/* Links Col 3: Về EduVerse */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Về EduVerse</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link className="hover:text-white transition" to="/about">Giới thiệu về chúng tôi</Link></li>
              <li><Link className="hover:text-white transition" to="/privacy">Chính sách bảo mật</Link></li>
              <li><Link className="hover:text-white transition" to="/terms">Điều khoản dịch vụ</Link></li>
              <li><Link className="hover:text-white transition" to="/careers">Tuyển dụng Giảng viên &amp; Cố vấn</Link></li>
              <li><Link className="hover:text-white transition" to="/partners">Hợp tác Trường học &amp; Doanh nghiệp</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © 2026 EduVerse. Bản quyền thuộc về Công ty Công nghệ Giáo dục EduVerse.
          </div>
          <div className="flex items-center gap-4">
            <span>Tiếng Việt (VN)</span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span>Bảo mật an toàn SSL 256-bit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
