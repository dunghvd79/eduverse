import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from '../../components/course/CourseCard';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Tất cả chương trình' },
    { id: 'english', label: 'Tiếng Anh Mũi nhọn' },
    { id: 'math', label: 'Toán học 10-11-12' },
    { id: 'literature', label: 'Ngữ văn THPT' },
    { id: 'exam', label: 'Luyện thi THPT QG & ĐGNL' },
  ];

  const featuredCourses = [
    {
      id: 'ielts-master-7',
      slug: 'ielts-master-7',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      badge: 'Bestseller',
      badgeType: 'rose',
      lessonCount: '68 bài giảng',
      rating: '4.9',
      reviewCount: '1.450',
      title: 'IELTS Master 7.0+ Toàn diện 4 Kỹ Năng & Luyện Đề Bứt Phá',
      instructor: 'Đội ngũ Cựu Examiner',
      price: '1.490.000đ',
      originalPrice: '2.800.000đ',
      category: 'english',
    },
    {
      id: 'toan-12-9plus',
      slug: 'toan-12-9plus',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
      badge: 'Phổ biến',
      badgeType: 'emerald',
      lessonCount: '56 chuyên đề',
      rating: '4.9',
      reviewCount: '1.120',
      title: 'Toán 12 & Luyện thi Tốt nghiệp THPT 9+ (Bứt phá Điểm 9, 10)',
      instructor: 'ThS. Trần Hoàng Nam',
      price: '890.000đ',
      originalPrice: '1.600.000đ',
      category: 'math',
    },
    {
      id: 'ngu-van-thpt',
      slug: 'ngu-van-thpt',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80',
      badge: 'Khuyên học',
      badgeType: 'amber',
      lessonCount: '42 bài giảng',
      rating: '4.8',
      reviewCount: '740',
      title: 'Chinh phục Ngữ văn THPT: Kỹ năng Nghị luận Xã hội & Đọc hiểu Điểm cao',
      instructor: 'Cô Phan Diệu Linh',
      price: '790.000đ',
      originalPrice: '1.450.000đ',
      category: 'literature',
    },
    {
      id: 'luyen-thi-dgnl-hsa',
      slug: 'luyen-thi-dgnl-hsa',
      thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
      badge: 'Mới ra mắt',
      badgeType: 'brand',
      lessonCount: '75 đề thực chiến',
      rating: '5.0',
      reviewCount: '620',
      title: 'Tổng ôn & Luyện đề Đánh giá Năng lực ĐHQG (HSA & APT) Toàn diện',
      instructor: 'Ban Chuyên môn EduVerse',
      price: '1.290.000đ',
      originalPrice: '2.400.000đ',
      category: 'exam',
    },
  ];

  const filteredCourses = selectedCategory === 'all'
    ? featuredCourses
    : featuredCourses.filter(c => c.category === selectedCategory);

  return (
    <div className="space-y-0">
      {/* 🚀 BEGIN: HeroCarouselSection */}
      <section className="relative hero-banner-bg border-b border-slate-200/60 overflow-hidden py-10 lg:py-16">
        {/* Carousel Nav Buttons */}
        <button
          aria-label="Slide trước"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-primary shadow-md border border-slate-100 flex items-center justify-center transition-all hover:scale-105"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
        </button>
        <button
          aria-label="Slide tiếp theo"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-primary shadow-md border border-slate-100 flex items-center justify-center transition-all hover:scale-105"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          </svg>
        </button>

        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tag and Accent */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-primary/20 shadow-xs mb-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Hệ Thống Luyện Thi Thông Minh 2026</span>
              </div>

              {/* Main Bold Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight uppercase">
                Nền tảng học tập &amp; luyện thi{' '}
                <span className="text-primary block mt-1">phát triển toàn diện</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base font-normal leading-relaxed">
                Học trực tuyến và luyện đề thông minh chuẩn chương trình Giáo dục Phổ thông mới kết hợp luyện thi chứng chỉ Tiếng Anh quốc tế.
              </p>

              {/* Key Feature Bullets */}
              <ul className="space-y-3.5 text-slate-700 text-sm sm:text-base font-medium pt-2">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center shadow-xs">
                    <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-slate-700">
                    <strong className="text-slate-900 font-semibold">Tiếng Anh chuẩn quốc tế:</strong> IELTS, TOEIC 4 kỹ năng, Tiếng Anh THPT trọng tâm với trợ lý AI phân tích phát âm và sửa bài viết.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center shadow-xs">
                    <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-slate-700">
                    <strong className="text-slate-900 font-semibold">Trọn bộ các môn THPT (Lớp 10, 11, 12):</strong> Toán học, Ngữ văn, Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý bám sát cấu trúc đề mới.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center shadow-xs">
                    <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-slate-700">
                    <strong className="text-slate-900 font-semibold">Đề thi thử không giới hạn:</strong> Ngân hàng 3,000+ đề thi THPT Quốc gia, Đánh giá năng lực (ĐHQG Hà Nội, ĐHQG TP.HCM, ĐH Bách Khoa).
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center shadow-xs">
                    <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-slate-700">
                    <strong className="text-slate-900 font-semibold">Chấm thi &amp; Giải thích chi tiết tức thì:</strong> Hệ thống tự động phân tích điểm mạnh - điểm yếu, chỉ ra lỗ hổng kiến thức từng chuyên đề.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center shadow-xs">
                    <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-slate-700">
                    <strong className="text-slate-900 font-semibold">Công cụ học tập tiện ích:</strong> Highlight đề, tra từ điển 1 chạm, sổ tay flashcards công thức &amp; từ vựng thông minh.
                  </span>
                </li>
              </ul>

              {/* Call to Actions */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/courses"
                  className="px-7 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 group"
                >
                  <span>Tìm hiểu thêm</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </Link>
                <Link
                  to="/courses"
                  className="px-6 py-3.5 bg-white border border-slate-300 hover:border-primary text-slate-700 hover:text-primary font-semibold rounded-lg transition-all"
                >
                  Khám phá chương trình -&gt;
                </Link>
              </div>
            </div>

            {/* Right Visual Showcase with Badges */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-[36px] p-2 bg-gradient-to-b from-amber-100/70 via-sky-50 to-slate-200 border-2 border-slate-300 shadow-xl">
                <div className="w-full h-full rounded-[28px] overflow-hidden bg-white relative flex flex-col justify-end">
                  <img
                    alt="Học viên luyện thi trực tuyến tại EduVerse"
                    className="w-full h-full object-cover object-top filter brightness-[1.02]"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                  
                  {/* Mini student label */}
                  <div className="absolute bottom-4 left-4 right-4 text-white p-3 rounded-xl bg-slate-900/70 backdrop-blur-sm border border-white/20">
                    <p className="text-xs font-semibold text-sky-300">EduVerse Learning System</p>
                    <p className="text-sm font-medium">Mô phỏng kỳ thi chứng chỉ chuẩn quốc tế</p>
                  </div>
                </div>

                {/* Badge 1: Top-Left "3000+ đề thi" */}
                <div className="absolute -top-4 -left-6 bg-gradient-to-tr from-rose-500 to-amber-500 text-white p-3.5 rounded-full w-24 h-24 flex flex-col items-center justify-center text-center shadow-lg transform -rotate-12 border-4 border-white animate-pulse">
                  <span className="text-base font-black leading-tight tracking-tight tabular-number">3000+</span>
                  <span className="text-[11px] font-bold uppercase leading-none">đề thi</span>
                </div>

                {/* Badge 2: Bottom-Right "1M+ Users" */}
                <div className="absolute -bottom-3 -right-5 bg-primary text-white p-3 rounded-full w-24 h-24 flex flex-col items-center justify-center text-center shadow-xl border-4 border-white">
                  <span className="text-base font-extrabold leading-tight tabular-number">1M+</span>
                  <span className="text-[9px] font-semibold tracking-wide uppercase opacity-90 leading-tight text-center">
                    Học sinh &amp; Sĩ tử
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center justify-center space-x-2 pt-10">
            <button aria-label="Slide 1" className="w-7 h-2 bg-primary rounded-full transition-all"></button>
            <button aria-label="Slide 2" className="w-2 h-2 bg-slate-300 hover:bg-slate-400 rounded-full transition-all"></button>
            <button aria-label="Slide 3" className="w-2 h-2 bg-slate-300 hover:bg-slate-400 rounded-full transition-all"></button>
          </div>
        </div>
      </section>

      {/* 📚 BEGIN: SubjectSpecializationSection */}
      <section className="py-12 bg-white border-b border-slate-200" id="subjects">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-50 text-primary text-xs font-bold uppercase mb-2">
              Hệ sinh thái học tập EduVerse
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Phân hệ môn học &amp; Khối lớp trọng tâm
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-1">
              Định vị Tiếng Anh mũi nhọn kết hợp toàn diện các môn văn hóa Lớp 10, 11, 12 và Luyện thi đại học.
            </p>
          </div>

          {/* 5 Feature Subject Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Tiếng Anh */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border-2 border-primary/20 hover:border-primary shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-primary text-white font-black text-sm mb-3 group-hover:scale-105 transition-transform w-auto">
                  English
                </div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">Ngoại ngữ</span>
                <h3 className="text-base font-bold text-slate-900 mt-1 mb-2 group-hover:text-primary transition-colors">
                  Tiếng Anh
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  IELTS 7.0+, TOEIC 800+, Tiếng Anh THPT. Tích hợp AI chấm bài và luyện phản xạ.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-primary tabular-number">1,250+ đề &amp; bài</span>
                <Link to="/courses?subject=english" className="text-slate-500 font-semibold group-hover:text-primary transition-colors">
                  Học ngay →
                </Link>
              </div>
            </div>

            {/* Card 2: Toán học THPT */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-sky-100 text-sky-600 font-black text-sm mb-3 group-hover:scale-105 transition-transform w-auto">
                  MATH
                </div>
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">Lớp 10 - 11 - 12</span>
                <h3 className="text-base font-bold text-slate-900 mt-1 mb-2 group-hover:text-primary transition-colors">
                  Toán học THPT
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Hàm số, Hình học không gian, Oxyz, Tích phân &amp; Xác suất. Ôn thi THPT 9+.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 tabular-number">850+ đề thi</span>
                <Link to="/courses?subject=math" className="text-slate-500 font-semibold group-hover:text-primary transition-colors">
                  Học ngay →
                </Link>
              </div>
            </div>

            {/* Card 3: Ngữ văn & Đọc hiểu */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-amber-100 text-amber-600 font-black text-sm mb-3 group-hover:scale-105 transition-transform w-auto">
                  LIT
                </div>
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Kỹ năng &amp; Luận</span>
                <h3 className="text-base font-bold text-slate-900 mt-1 mb-2 group-hover:text-primary transition-colors">
                  Ngữ văn &amp; Đọc hiểu
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Nghị luận văn học, Nghị luận xã hội, kỹ thuật phân tích ngữ liệu chuẩn ma trận mới.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 tabular-number">520+ đề &amp; bài mẫu</span>
                <Link to="/courses?subject=literature" className="text-slate-500 font-semibold group-hover:text-primary transition-colors">
                  Học ngay →
                </Link>
              </div>
            </div>

            {/* Card 4: KHTN Lý - Hóa - Sinh */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-600 font-black text-sm mb-3 group-hover:scale-105 transition-transform w-auto">
                  SCI
                </div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Lý - Hóa - Sinh</span>
                <h3 className="text-base font-bold text-slate-900 mt-1 mb-2 group-hover:text-primary transition-colors">
                  Khoa học Tự nhiên
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Bộ câu hỏi trắc nghiệm đúng/sai, bài tập trả lời ngắn vận dụng cao bám sát format mới.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 tabular-number">920+ đề thi</span>
                <Link to="/courses?subject=science" className="text-slate-500 font-semibold group-hover:text-primary transition-colors">
                  Học ngay →
                </Link>
              </div>
            </div>

            {/* Card 5: ĐGNL ĐHQG */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-blue-100 text-primary font-black text-sm mb-3 group-hover:scale-105 transition-transform w-auto">
                  HSA
                </div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">HSA • APT • V-SAT</span>
                <h3 className="text-base font-bold text-slate-900 mt-1 mb-2 group-hover:text-primary transition-colors">
                  Luyện thi ĐGNL
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Tư duy định lượng, định tính, khoa học và giải quyết vấn đề của ĐHQG HN &amp; TP.HCM.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 tabular-number">460+ đề thi</span>
                <Link to="/courses?subject=exam" className="text-slate-500 font-semibold group-hover:text-primary transition-colors">
                  Học ngay →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⭐ BEGIN: HighlightedCoursesSection */}
      <section className="py-14 sm:py-16 bg-white border-b border-slate-200" id="courses">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Khóa học &amp; Luyện thi nổi bật
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              Chương trình học tập tinh gọn, bài giảng video chuẩn nét kèm đề thi thử thực chiến từ Tiếng Anh mũi nhọn đến các môn văn hóa THPT.
            </p>
          </div>

          {/* Categories Pills Navigation */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-10">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 hover:border-primary text-sm font-semibold rounded-lg text-slate-700 hover:text-primary transition-colors"
            >
              Xem tất cả hơn 200+ khóa học &amp; đề thi →
            </Link>
          </div>
        </div>
      </section>

      {/* 💎 BEGIN: CoreValuesSection */}
      <section className="py-14 sm:py-16 bg-slate-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Tại sao học sinh &amp; phụ huynh tin chọn EduVerse?
            </h2>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">
              Môi trường khảo thí và bồi dưỡng kỹ năng toàn diện chuẩn mực quốc tế &amp; Bộ GD&amp;ĐT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-primary flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">Bám sát đề thi thật &amp; Ma trận mới</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Cấu trúc đề, giao diện làm bài và thang điểm chuẩn 100% so với format mới nhất của Bộ GD&amp;ĐT và các kỳ thi Quốc tế.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">Chấm &amp; Giải thích chi tiết bằng AI 24/7</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Hệ thống AI phân tích lỗi sai tức thì, hướng dẫn phương pháp giải từng bước và gợi ý bài tập khắc phục lỗ hổng kiến thức.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">Lộ trình học linh hoạt Lớp 10 - 12</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Đồng bộ dữ liệu học tập cá nhân hóa, lộ trình cuốn chiếu từ nắm chắc căn bản đến bứt phá điểm 9, 10 trên mọi thiết bị.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">Cộng đồng 1M+ học sinh &amp; thủ khoa</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Giao lưu, hỏi đáp và trao đổi phương pháp giải đề trực tiếp dưới mỗi câu hỏi cùng các thủ khoa và cố vấn chuyên môn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
