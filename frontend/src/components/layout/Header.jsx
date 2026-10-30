import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, BookOpen, UserCircle, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../common/Toast';
import { getInitials } from '../../utils/initials';

export default function Header() {
  const location = useLocation();
  const nav = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    toast.success('Đã đăng xuất thành công.');
    nav('/', { replace: true });
  };


  useEffect(() => {
    let scrollTimer = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Đánh dấu khi cuộn qua khỏi mép trên của trang
      setIsScrolled(currentScrollY > 15);

      // Nếu đang ở đỉnh trang (đầu trang), luôn hiển thị Navbar
      if (currentScrollY <= 15) {
        setIsVisible(true);
        if (scrollTimer) clearTimeout(scrollTimer);
        return;
      }

      // Khi người dùng đang lướt (scrolling), lập tức ẩn Navbar để màn hình thông thoáng
      setIsVisible(false);

      // Khi người dùng dừng lướt (sau 220ms), tự động hiện lại Navbar
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setIsVisible(true);
      }, 220);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  const isHome = location.pathname === '/';

  const navLinks = [
    { label: 'Giới thiệu', path: '/' },
    { label: 'Khám phá', path: '/courses' },
    { label: 'Tiếng Anh', path: '/courses?subject=english' },
    { label: 'Lớp 10 - 12', path: '/courses?level=thpt' },
    { label: 'Luyện thi', path: '/courses?type=exam' },
  ];

  const handleNavClick = (path, e) => {
    if (path === '/' && location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ease-in-out ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-full opacity-0 pointer-events-none'
      } ${
        isHome
          ? isScrolled
            ? 'bg-[#dbeafe]/95 backdrop-blur-md border-b border-sky-200/70 shadow-xs'
            : 'nav-hero-blend border-b-0 shadow-none'
          : 'bg-gradient-to-b from-[#d5eafd] to-[#e4f2fe] border-b border-sky-200/70 shadow-2xs'
      }`}
    >
      <div className="max-w-[1536px] mx-auto px-6 sm:px-10 lg:px-14 h-18 sm:h-20 flex items-center justify-between py-3">
        {/* Brand Logo Left */}
        <Link
          to="/"
          onClick={(e) => handleNavClick('/', e)}
          className="flex items-center group"
          title="EduVerse Trang chủ"
        >
          <svg className="h-9 sm:h-10 w-auto" fill="none" viewBox="0 0 170 48" xmlns="http://www.w3.org/2000/svg">
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
        <div className="flex items-center gap-6 lg:gap-8">
          <nav className="hidden lg:flex items-center space-x-6 lg:space-x-7 text-[16px] sm:text-[16.5px] font-semibold text-primary">
            {navLinks.map((item, idx) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname + location.search === item.path;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  onClick={(e) => handleNavClick(item.path, e)}
                  className={`transition-all py-1.5 hover:text-blue-800 ${
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-primary/95 font-semibold hover:opacity-90'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Lối tắt nhanh vào khu vực học tập/làm việc */}
              <Link
                to={
                  user.role === 'student'
                    ? '/student/dashboard'
                    : `/${user.role === 'teacher' ? 'teacher' : user.role === 'training_manager' ? 'manager' : 'admin'}/dashboard`
                }
                className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#1168bd] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 hover:shadow-md cursor-pointer no-underline"
              >
                <GraduationCap size={16} />
                <span>{user.role === 'student' ? 'Bàn học của tôi' : 'Không gian làm việc'}</span>
              </Link>

              {/* User Avatar & Dropdown Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full p-1 transition-all hover:ring-2 hover:ring-blue-300 focus:outline-none cursor-pointer"
                >
                  <div className="h-9 w-9 rounded-full bg-[#1168bd] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(user.fullName)
                    )}
                  </div>
                  <span className="hidden md:inline-block text-xs font-bold text-slate-800 max-w-[130px] truncate">
                    {user.fullName}
                  </span>
                  <ChevronDown size={14} className="hidden md:inline-block text-slate-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="m-0 font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="m-0 mt-0.5 text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#1168bd]">
                        {user.role === 'student'
                          ? 'Học viên'
                          : user.role === 'teacher'
                          ? 'Giảng viên'
                          : user.role === 'training_manager'
                          ? 'Quản lý đào tạo'
                          : 'Quản trị viên'}
                      </span>
                    </div>

                    <div className="py-1">
                      {user.role === 'student' ? (
                        <>
                          <Link
                            to="/student/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1168bd] transition-colors no-underline"
                          >
                            <LayoutDashboard size={15} /> Bàn học của tôi
                          </Link>
                          <Link
                            to="/student/my-courses"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1168bd] transition-colors no-underline"
                          >
                            <BookOpen size={15} /> Khóa học của tôi
                          </Link>
                          <Link
                            to="/student/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1168bd] transition-colors no-underline"
                          >
                            <UserCircle size={15} /> Hồ sơ cá nhân
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/${user.role === 'teacher' ? 'teacher' : user.role === 'training_manager' ? 'manager' : 'admin'}/dashboard`}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1168bd] transition-colors no-underline"
                          >
                            <LayoutDashboard size={15} /> Không gian làm việc
                          </Link>
                          <Link
                            to={`/${user.role === 'teacher' ? 'teacher' : user.role === 'training_manager' ? 'manager' : 'admin'}/profile`}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1168bd] transition-colors no-underline"
                          >
                            <UserCircle size={15} /> Hồ sơ cá nhân
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut size={15} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              {/* Nút Đăng nhập: Khung hình đám mây trắng viền trời */}
              <Link
                to="/auth/login"
                className="relative inline-flex items-center justify-center w-[122px] sm:w-[128px] h-[42px] sm:h-[46px] group transition-all duration-200 hover:scale-105 active:scale-95"
                title="Đăng nhập tài khoản EduVerse"
              >
                <svg
                  viewBox="0 0 124 46"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-2xs group-hover:drop-shadow-xs transition-all"
                >
                  <path
                    d="M22 41C11 41 2 33 2 23C2 13.5 9.5 5.5 19 4.2C22.5 1.5 27 0 32 0C39.5 0 46 3.5 49.5 9C54 4 61.5 0.5 70 0.5C81.5 0.5 91 7.5 94 17.5C98 15 103 13.5 108 13.5C116.5 13.5 123 20 123 28.5C123 37 116.5 43.5 108 43.5C106 43.5 103.5 42.8 101.5 42C97.5 44 92.5 45.5 86.5 45.5C79 45.5 72.5 43 68.5 40C63.5 43 55.5 45 47 45C37 45 28 42 22 41Z"
                    fill="#ffffff"
                    stroke="#93c5fd"
                    strokeWidth="1.6"
                    className="group-hover:stroke-primary transition-colors"
                  />
                </svg>
                <span className="relative z-10 text-[13.5px] sm:text-[14.5px] font-bold text-primary group-hover:text-blue-800 transition-colors mt-0.5">
                  Đăng nhập
                </span>
              </Link>

              {/* Nút Đăng ký: Khung hình đám mây xanh dương rực rỡ */}
              <Link
                to="/auth/register"
                className="relative inline-flex items-center justify-center w-[112px] sm:w-[118px] h-[42px] sm:h-[46px] group transition-all duration-200 hover:scale-105 active:scale-95"
                title="Đăng ký tài khoản EduVerse"
              >
                <svg
                  viewBox="0 0 116 46"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-xs group-hover:drop-shadow-sm transition-all"
                >
                  <defs>
                    <linearGradient id="navCloudRegisterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1677d2" />
                      <stop offset="100%" stopColor="#0b4e94" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M20 41C10 41 2 33 2 23C2 13.5 9 5.5 17.5 4.2C20.5 1.5 25 0 29.5 0C36.5 0 42.5 3.5 45.5 9C49.5 4 56.5 0.5 64.5 0.5C75 0.5 84 7.5 86.5 17.5C90 15 94.5 13.5 99 13.5C107 13.5 113 20 113 28.5C113 37 107 43.5 99 43.5C97 43.5 94.5 42.8 92.5 42C89 44 84 45.5 78.5 45.5C72 45.5 66 43 62 40C57.5 43 50 45 42 45C33 45 25 42 20 41Z"
                    fill="url(#navCloudRegisterGrad)"
                  />
                </svg>
                <span className="relative z-10 text-[13.5px] sm:text-[14.5px] font-bold text-white transition-colors mt-0.5">
                  Đăng ký
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
