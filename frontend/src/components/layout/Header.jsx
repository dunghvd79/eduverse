import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const navLinks = [
    { label: 'Giới thiệu', path: '/#about' },
    { label: 'Khám phá', path: '/courses' },
    { label: 'Tiếng Anh', path: '/courses?subject=english' },
    { label: 'Lớp 10 - 12', path: '/courses?level=thpt' },
    { label: 'Luyện thi', path: '/courses?type=exam' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-2.5">
        {/* Brand Logo Left */}
        <Link to="/" className="flex items-center group" title="EduVerse Trang chủ">
          <svg className="h-10 w-auto" fill="none" viewBox="0 0 170 48" xmlns="http://www.w3.org/2000/svg">
            <rect fill="#1168bd" height="40" rx="10" width="40" x="4" y="4" />
            <path d="M14 26L24 16L34 26M24 16V32" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            <circle cx="24" cy="14" fill="#38bdf8" r="2.5" />
            <path d="M16 29C18 32 21 34 24 34C27 34 30 32 32 29" stroke="#93c5fd" strokeLinecap="round" strokeWidth="2.2" />
            <text fill="#0f172a" fontFamily="Inter, sans-serif" fontSize="24" fontWeight="800" letterSpacing="-0.5" x="54" y="32">
              Edu<tspan fill="#1168bd">Verse</tspan>
            </text>
          </svg>
        </Link>

        {/* Right Group: Nav Links & Action Buttons */}
        <div className="flex items-center gap-8">
          <nav className="hidden lg:flex items-center space-x-8 text-base font-medium text-slate-700">
            {navLinks.map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`hover:text-primary transition-colors py-1 ${
                    isActive ? 'text-primary font-semibold' : ''
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 border border-slate-300 rounded-lg transition-all"
            >
              Đăng nhập
            </Link>
            <Link
              to="/auth/register"
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-primary/20 active:scale-95"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
