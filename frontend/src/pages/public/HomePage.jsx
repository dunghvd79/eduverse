import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CourseCard from '../../components/course/CourseCard';
import courseService from '../../services/courseService';
import heroStudentCutout from '../../assets/hero_student_cutout.png';

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Advisory Form State
  const [advisoryForm, setAdvisoryForm] = useState({
    name: '',
    phone: '',
    address: '',
    subject: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleAdvisorySubmit = (e) => {
    e.preventDefault();
    if (!advisoryForm.name || !advisoryForm.phone) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setAdvisoryForm({ name: '', phone: '', address: '', subject: '' });
      setFormSubmitted(false);
    }, 4000);
  };

  // Khóa học online nổi bật (Dữ liệu chuẩn phong cách thương mại Study4)
  const categories = [
    { id: 'all', label: 'Tất cả chương trình' },
    { id: 'english', label: 'Tiếng Anh Quốc tế' },
    { id: 'math', label: 'Toán học 10-11-12' },
    { id: 'literature', label: 'Ngữ văn THPT' },
    { id: 'exam', label: 'Luyện thi ĐGNL & THPT QG' },
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
      reviewCount: '260',
      studentCount: '194,637 Học viên',
      formatTag: 'Phần mềm online & Video',
      title: '[Complete IELTS 7.0+] Chiến lược làm bài 4 kỹ năng - Chữa đề - Luyện nghe với Dictation [Tặng AI Writing & Speaking]',
      instructor: 'Đội ngũ Cựu Examiner',
      price: '1.050.000đ',
      originalPrice: '1.800.000đ',
      discount: '-41%',
      category: 'english',
    },
    {
      id: 'toeic-intensive-850',
      slug: 'toeic-intensive-850',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
      badge: 'Phổ biến',
      badgeType: 'emerald',
      lessonCount: '52 chuyên đề',
      rating: '4.9',
      reviewCount: '211',
      studentCount: '107,175 Học viên',
      formatTag: 'Phần mềm online & Video',
      title: '[Complete TOEIC 850+] Chiến lược bứt phá Reading & Listening - Phản xạ từ vựng Spaced Repetition',
      instructor: 'ThS. Nguyễn Thu Hằng',
      price: '799.000đ',
      originalPrice: '989.000đ',
      discount: '-19%',
      category: 'english',
    },
    {
      id: 'toan-12-9plus',
      slug: 'toan-12-9plus',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
      badge: 'Trọng điểm',
      badgeType: 'amber',
      lessonCount: '56 chuyên đề',
      rating: '4.9',
      reviewCount: '184',
      studentCount: '82,450 Học viên',
      formatTag: 'Khóa học Video & Đề thi thử',
      title: '[Toán 12 Bứt Phá 9+] Tổng ôn ma trận mới 2026 - Kỹ thuật Casio & Tư duy giải nhanh trắc nghiệm đúng/sai',
      instructor: 'ThS. Trần Hoàng Nam',
      price: '890.000đ',
      originalPrice: '1.500.000đ',
      discount: '-40%',
      category: 'math',
    },
    {
      id: 'luyen-thi-dgnl-hsa',
      slug: 'luyen-thi-dgnl-hsa',
      thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
      badge: 'Mới ra mắt',
      badgeType: 'brand',
      lessonCount: '75 đề thực chiến',
      rating: '5.0',
      reviewCount: '176',
      studentCount: '54,200 Học viên',
      formatTag: 'Phần mềm luyện đề thi thử',
      title: '[HSA & APT Master] Luyện thi Đánh giá Năng lực ĐHQG Hà Nội & TP.HCM - Tư duy định lượng, định tính & Khoa học',
      instructor: 'Ban Chuyên môn EduVerse',
      price: '1.190.000đ',
      originalPrice: '1.990.000đ',
      discount: '-40%',
      category: 'exam',
    },
  ];

  const [courses, setCourses] = useState(featuredCourses);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Fetch dữ liệu thật từ Backend (Phương án Hybrid: nếu DB có thì hiển thị, nếu rỗng thì tự động fallback về featuredCourses)
  useEffect(() => {
    let cancelled = false;

    const fetchFeaturedCourses = async () => {
      try {
        setLoadingCourses(true);
        const data = await courseService.list({ status: 'published', limit: 8 });
        const items = data?.items || [];

        if (!cancelled) {
          if (items.length > 0) {
            const mapped = items.map((c) => ({
              id: c.id,
              slug: c.slug || c.id,
              thumbnail: c.thumbnailUrl || c.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
              badge: c.badge || (c.category?.name ? c.category.name : (Number(c.price) === 0 ? 'Miễn phí' : 'Nổi bật')),
              badgeType: c.category?.slug === 'english' ? 'rose' : (c.category?.slug === 'math' ? 'amber' : (c.category?.slug === 'exam' ? 'brand' : 'emerald')),
              lessonCount: c.totalLessons ? `${c.totalLessons} bài học` : (c.lesson_count ? `${c.lesson_count} bài học` : '50+ bài giảng'),
              rating: c.rating || '4.9',
              reviewCount: c.review_count || '180',
              studentCount: c.student_count ? `${c.student_count.toLocaleString()} Học viên` : '15,200+ Học viên',
              formatTag: c.format_tag || 'Khóa học video & Đề thi',
              title: c.title,
              instructor: c.owner?.fullName || c.owner?.full_name || c.owner?.name || 'Giảng viên EduVerse',
              price: Number(c.price) === 0 ? 'Miễn phí' : `${Number(c.price || 0).toLocaleString('vi-VN')}đ`,
              originalPrice: c.original_price ? `${Number(c.original_price).toLocaleString('vi-VN')}đ` : null,
              discount: c.discount || null,
              category: c.category?.slug || 'english',
            }));

            // Nếu DB có ít hơn 4 khóa học, bổ sung thêm các khóa mẫu để giao diện luôn đầy đặn
            if (mapped.length < 4) {
              const existingIds = new Set(mapped.map((m) => m.id));
              const remaining = featuredCourses.filter((f) => !existingIds.has(f.id));
              setCourses([...mapped, ...remaining]);
            } else {
              setCourses(mapped);
            }
          } else {
            setCourses(featuredCourses);
          }
        }
      } catch {
        if (!cancelled) {
          setCourses(featuredCourses);
        }
      } finally {
        if (!cancelled) {
          setLoadingCourses(false);
        }
      }
    };

    fetchFeaturedCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCourses = selectedCategory === 'all'
    ? courses
    : courses.filter((c) => c.category === selectedCategory);

  return (
    <div className="space-y-0 text-slate-800">
      {/* 🚀 1. HERO SECTION (Tương tự banner chính Study4, tỷ lệ vừa vặn) */}
      <section className="relative hero-banner-bg border-b border-slate-200/70 overflow-hidden py-9 lg:py-14">
        {/* Decorative Symbolic Sky Clouds (Mây tượng trưng phong cách Bầu trời) */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {/* Mây 1: Góc trên bên trái */}
          <div className="absolute top-5 left-6 sm:left-14 opacity-85 animate-cloud-slow">
            <svg width="135" height="50" viewBox="0 0 135 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xs">
              <path d="M30 44C13.431 44 0 34.15 0 22C0 9.85 13.431 0 30 0C41.648 0 51.71 4.847 56.588 12.096C60.98 8.764 66.767 6.7 73.125 6.7C85.551 6.7 95.625 14.42 95.625 23.942C101.914 24.996 106.875 30.267 106.875 36.635C106.875 39.8 105.656 42.385 103.547 44H30Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>

          {/* Mây 2: Giữa trên cao - mây thoáng nhỏ */}
          <div className="absolute top-8 left-1/3 opacity-70 animate-cloud-gentle hidden sm:block">
            <svg width="105" height="40" viewBox="0 0 105 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xs">
              <path d="M24 36C10.745 36 0 27.941 0 18C0 8.059 10.745 0 24 0C33.319 0 41.368 3.966 45.27 9.897C48.784 7.17 53.411 5.482 58.5 5.482C68.441 5.482 76.5 11.799 76.5 19.589C82.022 20.452 86.25 24.764 86.25 29.973C86.25 33.2 84.812 36 82.898 36H24Z" fill="white" fillOpacity="0.85" />
            </svg>
          </div>

          {/* Mây 3: Góc trên bên phải */}
          <div className="absolute top-5 right-10 sm:right-24 opacity-90 animate-cloud-slow">
            <svg width="150" height="54" viewBox="0 0 150 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xs">
              <path d="M34 48C15.222 48 0 37.255 0 24C0 10.745 15.222 0 34 0C47.2 0 58.6 5.26 64.1 13.2C69.1 9.6 75.7 7.4 83 7.4C97.1 7.4 108.6 15.8 108.6 26.1C115.8 27.2 121.7 32.9 121.7 40.1C121.7 44.5 119.8 48 117 48H34Z" fill="white" fillOpacity="0.92" />
            </svg>
          </div>

          {/* Mây 4: Phía sau nữ sinh / góc dưới bên phải */}
          <div className="absolute bottom-8 right-6 sm:right-1/4 opacity-60 animate-cloud-gentle hidden md:block">
            <svg width="115" height="42" viewBox="0 0 115 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M26 38C11.64 38 0 29.493 0 19C0 8.507 11.64 0 26 0C36.096 0 44.816 4.207 49.043 10.5C52.852 7.606 57.868 5.819 63.375 5.819C74.15 5.819 82.875 12.516 82.875 20.781C88.68 21.698 93.375 26.268 93.375 32.015C93.375 35.438 91.796 38 89.656 38H26Z" fill="white" fillOpacity="0.8" />
            </svg>
          </div>
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Cột nội dung trái */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 lg:pr-6 xl:pr-10">
              {/* Headline đanh thép, giãn dòng thoáng đãng */}
              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-3xl lg:text-[31px] font-extrabold text-slate-900 tracking-tight leading-tight uppercase">
                  Nền tảng học tập &amp; luyện thi{' '}
                  <span className="text-primary block mt-1.5">phát triển toàn diện</span>
                </h1>
                <p className="text-slate-600 text-sm sm:text-[15px] font-normal leading-relaxed max-w-xl pt-1">
                  Học trực tuyến và luyện đề thông minh chuẩn chương trình Giáo dục Phổ thông mới kết hợp luyện thi chứng chỉ Tiếng Anh quốc tế (IELTS, TOEIC) và Luyện thi ĐGNL ĐHQG.
                </p>
              </div>

              {/* 4 Lợi thế cốt lõi giãn đều, thoáng mắt */}
              <ul className="space-y-3.5 sm:space-y-4 text-slate-700 text-xs sm:text-[13.5px] font-medium pt-2">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-4.5 h-4.5 rounded-full bg-blue-100 text-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="leading-relaxed">
                    <strong className="text-slate-900 font-semibold">Tiếng Anh chuẩn quốc tế:</strong> IELTS, TOEIC 4 kỹ năng &amp; THPT trọng tâm với trợ lý AI phân tích phát âm, sửa bài viết.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-4.5 h-4.5 rounded-full bg-blue-100 text-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="leading-relaxed">
                    <strong className="text-slate-900 font-semibold">Trọn bộ các môn THPT (Lớp 10, 11, 12):</strong> Toán, Ngữ văn, KHTN bám sát cấu trúc ma trận đề thi mới.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-4.5 h-4.5 rounded-full bg-blue-100 text-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="leading-relaxed">
                    <strong className="text-slate-900 font-semibold">Ngân hàng 3,000+ đề thi:</strong> Đề thi thử THPT Quốc gia &amp; Đánh giá năng lực (HSA, APT, V-SAT).
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-4.5 h-4.5 rounded-full bg-blue-100 text-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="leading-relaxed">
                    <strong className="text-slate-900 font-semibold">Chấm thi &amp; Giải thích chi tiết tức thì:</strong> AI phân tích điểm mạnh - điểm yếu, chỉ rõ lỗ hổng kiến thức từng chuyên đề.
                  </span>
                </li>
              </ul>

              {/* Call to Actions - Thiết kế chuẩn EdTech Cao Cấp */}
              <div className="pt-3 sm:pt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3.5">
                  <Link
                    to="/courses"
                    className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-[#1168bd] to-[#0c59a4] hover:from-[#0d5cb6] hover:to-[#0a4d8c] text-white text-sm sm:text-[15px] font-bold rounded-xl shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 group"
                  >
                    <span>Khám phá khóa học ngay</span>
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-3 h-3 text-white fill-current group-hover:translate-x-0.5 transition-transform" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </Link>

                  <a
                    href="#categories"
                    className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-primary text-slate-700 hover:text-primary text-sm sm:text-[15px] font-semibold rounded-xl shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 group"
                  >
                    <span>Xem danh mục ngành học</span>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-y-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Cột hình ảnh minh họa (Nữ sinh EduVerse với 2 huy hiệu tròn nổi bật) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative items-center">
              <div className="relative w-full max-w-[390px] sm:max-w-[430px] lg:max-w-[460px] transition-transform duration-300 hover:scale-[1.02]">
                <img
                  alt="Học viên luyện thi trực tuyến tại EduVerse"
                  className="w-full h-auto object-contain filter drop-shadow-xl"
                  src={heroStudentCutout}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📚 2. PHÂN HỆ MÔN HỌC & KHỐI LỚP TRỌNG TÂM (5 Bento Cards Cao Cấp, Căn Lề Đồng Bộ) */}
      <section className="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-200/80" id="subjects">
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Phân hệ Môn học - Căn giữa đồng bộ chuyên nghiệp */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Phân hệ Môn học &amp; Khối lớp trọng tâm
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
              Chương trình học tập chuyên sâu bám sát ma trận đề thi mới của Bộ GD&amp;ĐT và các chứng chỉ quốc tế.
            </p>
          </div>

          {/* Grid 5 Bento Cards - Theo đúng mẫu Template cao cấp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-5.5">
            {/* 1. Tiếng Anh */}
            <Link
              to="/courses?category=english"
              className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Banner Gradient với vòng tròn trang trí mờ */}
                <div className="relative px-4.5 pt-4.5 pb-7 sm:px-5 sm:pt-5 sm:pb-8 bg-gradient-to-br from-sky-600 via-sky-700 to-blue-700 overflow-hidden text-white">
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-xs pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-white/80 font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wider truncate">
                        IELTS • THPT
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold text-[11px] tracking-wide shadow-2xs whitespace-nowrap shrink-0">
                        English
                      </span>
                    </div>
                    <h3 className="text-white font-extrabold text-[16px] sm:text-[17px] tracking-tight leading-snug whitespace-nowrap truncate" title="Tiếng Anh Chuẩn">
                      Tiếng Anh Chuẩn
                    </h3>
                  </div>
                </div>

                {/* Floating Square Icon (Chìm nửa trên / nổi nửa dưới) */}
                <div className="-mt-6 ml-5 sm:ml-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                  </div>
                </div>

                {/* Đoạn mô tả */}
                <div className="px-5 sm:px-6 pt-3 pb-1">
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal min-h-[54px] line-clamp-3">
                    IELTS 7.0+, TOEIC 800+, Tiếng Anh THPT. Tích hợp trợ lý AI sửa bài viết &amp; luyện phản xạ nói.
                  </p>
                </div>
              </div>

              {/* Chân thẻ: 3 Cột thống kê & Nút CTA full-width */}
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2">
                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      1,250+
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Đề &amp; bài
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-primary leading-tight">
                      AI
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Chấm bài
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      3
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Lộ trình
                    </span>
                  </div>
                </div>

                <div className="w-full py-2.5 px-4 rounded-xl bg-sky-50/80 group-hover:bg-primary group-hover:text-white text-primary font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 border border-sky-100/90 group-hover:border-primary shadow-2xs">
                  <span>Học ngay</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>

            {/* 2. Toán THPT */}
            <Link
              to="/courses?category=math"
              className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Banner Gradient */}
                <div className="relative px-4.5 pt-4.5 pb-7 sm:px-5 sm:pt-5 sm:pb-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 overflow-hidden text-white">
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-xs pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-white/80 font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wider truncate">
                        LỚP 10 - 11 - 12
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold text-[11px] tracking-wide shadow-2xs whitespace-nowrap shrink-0">
                        MATH
                      </span>
                    </div>
                    <h3 className="text-white font-extrabold text-[16px] sm:text-[17px] tracking-tight leading-snug whitespace-nowrap truncate" title="Toán học THPT">
                      Toán học THPT
                    </h3>
                  </div>
                </div>

                {/* Floating Square Icon */}
                <div className="-mt-6 ml-5 sm:ml-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19l4-14 4 14 4-14 4 14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Đoạn mô tả */}
                <div className="px-5 sm:px-6 pt-3 pb-1">
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal min-h-[54px] line-clamp-3">
                    Hàm số, Oxyz, Tích phân &amp; Xác suất. Ôn luyện bám sát ma trận đề thi tốt nghiệp mục tiêu 9+.
                  </p>
                </div>
              </div>

              {/* Chân thẻ: 3 Cột thống kê & Nút CTA full-width */}
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2">
                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      850+
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Đề thi
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-blue-600 leading-tight">
                      9+
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Mục tiêu
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      Full
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Chuyên đề
                    </span>
                  </div>
                </div>

                <div className="w-full py-2.5 px-4 rounded-xl bg-blue-50/80 group-hover:bg-blue-600 group-hover:text-white text-blue-700 font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 border border-blue-100/90 group-hover:border-blue-600 shadow-2xs">
                  <span>Học ngay</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>

            {/* 3. Ngữ văn */}
            <Link
              to="/courses?category=literature"
              className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Banner Gradient */}
                <div className="relative px-4.5 pt-4.5 pb-7 sm:px-5 sm:pt-5 sm:pb-8 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 overflow-hidden text-white">
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-xs pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-white/80 font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wider truncate">
                        KỸ NĂNG &amp; NGHỊ LUẬN
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold text-[11px] tracking-wide shadow-2xs whitespace-nowrap shrink-0">
                        LIT
                      </span>
                    </div>
                    <h3 className="text-white font-extrabold text-[16px] sm:text-[17px] tracking-tight leading-snug whitespace-nowrap truncate" title="Ngữ văn &amp; Đọc hiểu">
                      Ngữ văn &amp; Đọc hiểu
                    </h3>
                  </div>
                </div>

                {/* Floating Square Icon */}
                <div className="-mt-6 ml-5 sm:ml-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Đoạn mô tả */}
                <div className="px-5 sm:px-6 pt-3 pb-1">
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal min-h-[54px] line-clamp-3">
                    Nghị luận văn học, Nghị luận xã hội, kỹ thuật phân tích ngữ liệu ngoài SGK chuẩn ma trận mới.
                  </p>
                </div>
              </div>

              {/* Chân thẻ: 3 Cột thống kê & Nút CTA full-width */}
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2">
                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      520+
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Bài mẫu
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-amber-700 leading-tight">
                      2026
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Format mới
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      100%
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Dẫn chứng
                    </span>
                  </div>
                </div>

                <div className="w-full py-2.5 px-4 rounded-xl bg-amber-50/80 group-hover:bg-amber-600 group-hover:text-white text-amber-800 font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 border border-amber-100/90 group-hover:border-amber-600 shadow-2xs">
                  <span>Học ngay</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>

            {/* 4. KHTN */}
            <Link
              to="/courses?category=science"
              className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Banner Gradient */}
                <div className="relative px-4.5 pt-4.5 pb-7 sm:px-5 sm:pt-5 sm:pb-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 overflow-hidden text-white">
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-xs pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-white/80 font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wider truncate">
                        LÝ - HÓA - SINH
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold text-[11px] tracking-wide shadow-2xs whitespace-nowrap shrink-0">
                        SCI
                      </span>
                    </div>
                    <h3 className="text-white font-extrabold text-[16px] sm:text-[17px] tracking-tight leading-snug whitespace-nowrap truncate" title="Khoa học Tự nhiên">
                      Khoa học Tự nhiên
                    </h3>
                  </div>
                </div>

                {/* Floating Square Icon */}
                <div className="-mt-6 ml-5 sm:ml-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Đoạn mô tả */}
                <div className="px-5 sm:px-6 pt-3 pb-1">
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal min-h-[54px] line-clamp-3">
                    Bộ câu hỏi trắc nghiệm đúng/sai, trả lời ngắn vận dụng cao bám sát format thi tốt nghiệp 2026.
                  </p>
                </div>
              </div>

              {/* Chân thẻ: 3 Cột thống kê & Nút CTA full-width */}
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2">
                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      920+
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Đề thi
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-emerald-700 leading-tight">
                      Đúng/Sai
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Format
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      VDC
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Vận dụng
                    </span>
                  </div>
                </div>

                <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50/80 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 border border-emerald-100/90 group-hover:border-emerald-600 shadow-2xs">
                  <span>Học ngay</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>

            {/* 5. ĐGNL */}
            <Link
              to="/courses?category=exam"
              className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Banner Gradient */}
                <div className="relative px-4.5 pt-4.5 pb-7 sm:px-5 sm:pt-5 sm:pb-8 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 overflow-hidden text-white">
                  <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-xs pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-white/80 font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wider truncate">
                        HSA • APT • V-SAT
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold text-[11px] tracking-wide shadow-2xs whitespace-nowrap shrink-0">
                        HSA
                      </span>
                    </div>
                    <h3 className="text-white font-extrabold text-[16px] sm:text-[17px] tracking-tight leading-snug whitespace-nowrap truncate" title="Luyện thi ĐGNL">
                      Luyện thi ĐGNL
                    </h3>
                  </div>
                </div>

                {/* Floating Square Icon */}
                <div className="-mt-6 ml-5 sm:ml-6 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Đoạn mô tả */}
                <div className="px-5 sm:px-6 pt-3 pb-1">
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal min-h-[54px] line-clamp-3">
                    Tư duy định lượng, định tính, khoa học và giải quyết vấn đề của ĐHQG HN &amp; TP.HCM.
                  </p>
                </div>
              </div>

              {/* Chân thẻ: 3 Cột thống kê & Nút CTA full-width */}
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2">
                <div className="grid grid-cols-3 gap-2 mb-3.5">
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      460+
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Đề thi
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-purple-700 leading-tight">
                      2 ĐHQG
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      HN &amp; HCM
                    </span>
                  </div>
                  <div className="bg-slate-50/90 rounded-xl py-2 px-1 text-center border border-slate-100/70">
                    <div className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-tight">
                      Top 5%
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium block mt-0.5 whitespace-nowrap">
                      Mục tiêu
                    </span>
                  </div>
                </div>

                <div className="w-full py-2.5 px-4 rounded-xl bg-purple-50/80 group-hover:bg-purple-600 group-hover:text-white text-purple-800 font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 border border-purple-100/90 group-hover:border-purple-600 shadow-2xs">
                  <span>Học ngay</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Nút Xem tất cả phân hệ môn học căn giữa */}
          <div className="text-center mt-8">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-primary bg-white hover:bg-sky-50 border border-sky-200/80 shadow-2xs hover:shadow transition-all group"
            >
              <span>Xem tất cả phân hệ môn học &amp; chứng chỉ</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ⭐ 3. KHÓA HỌC ONLINE NỔI BẬT (Chuẩn phong cách Study4: Rating sao, Học viên, Badge giảm giá đỏ) */}
      <section className="py-12 bg-white border-b border-slate-200" id="courses">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section 3 - Căn giữa chuyên nghiệp */}
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Khóa học online nổi bật
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Chương trình bản quyền, video bài giảng cùng công nghệ luyện tập Dictation, Flashcards và AI Speaking/Writing.
            </p>
          </div>

          {/* Tab Categories Pills - Căn giữa cân đối */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                      : 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Grid Khóa học / Skeleton Loading / Empty State */}
          {loadingCourses ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs animate-pulse">
                  <div className="aspect-video bg-slate-200 rounded-xl mb-3.5" />
                  <div className="h-3.5 bg-slate-200 rounded w-1/3 mb-2.5" />
                  <div className="h-4 bg-slate-200 rounded w-5/6 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-2/3 mb-4" />
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-7 bg-slate-200 rounded-lg w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-14 px-6 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-300/80">
              <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-sky-100/70 text-primary flex items-center justify-center text-2xl shadow-2xs">
                📚
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">
                Chuyên đề đang chuẩn bị ra mắt
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                Đội ngũ giáo viên và chuyên gia EduVerse đang hoàn thiện các video bài giảng và bộ câu hỏi trắc nghiệm thực chiến cho danh mục này.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  ← Xem các khóa học khác
                </button>
                <a
                  href="#consultation"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Nhận thông báo khi có khóa mới</span>
                  <span>🔔</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {/* Nút Xem tất cả */}
          <div className="text-center mt-8">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center px-6 py-2.5 border border-slate-300 hover:border-primary text-xs sm:text-sm font-semibold rounded-lg text-slate-700 hover:text-primary transition-colors"
            >
              Xem tất cả hơn 200+ khóa học &amp; phần mềm →
            </Link>
          </div>
        </div>
      </section>



      {/* 📬 4. FORM TƯ VẤN LỘ TRÌNH HỌC (Chuẩn khối sky-bg của Study4) */}
      <section className="py-12 bg-[#f0f7ff] border-b border-blue-100" id="consultation">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Cột trái: Giới thiệu công nghệ đào tạo (chuẩn Study4 text) */}
            <div className="lg:col-span-8 xl:col-span-7 space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <h2 className="text-xl sm:text-2xl lg:text-[22px] xl:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug whitespace-normal sm:whitespace-nowrap">
                Lộ trình học cá nhân hóa với công nghệ khảo thí thông minh
              </h2>
              <p>
                Các <strong className="text-primary font-semibold">phần mềm luyện thi IELTS, TOEIC và ôn thi THPT, ĐGNL</strong> chất lượng cao của EduVerse đều được thiết kế sát format thi thật 2026, theo chương trình chuẩn CEFR (A1-C2) kết hợp ma trận khảo thí của Bộ GD&amp;ĐT và Đại học Quốc Gia.
              </p>
              <p>
                EduVerse áp dụng những công nghệ tối ưu vào học tập như <strong className="text-slate-900 font-semibold">Spaced-Repetition</strong> để ôn tập flashcards từ vựng và công thức, <strong className="text-slate-900 font-semibold">Trợ lý AI</strong> để chấm chữa phát âm, sửa bài thi nói/viết và chỉ rõ lỗ hổng kiến thức từng chuyên đề. Toàn bộ tiến độ luyện thi được thống kê chi tiết theo ngày để dễ dàng bứt phá điểm số.
              </p>
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-medium text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span>Học thử và làm bài test miễn phí</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span>Ngân hàng giải thích chi tiết 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span>Trợ giảng hỗ trợ giải đáp 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                  <span>Cam kết chuẩn đầu ra rõ ràng</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Form tư vấn lộ trình học (Form trực tiếp Study4 style) */}
            <div className="lg:col-span-4 xl:col-span-5">
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-blue-200/70">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                  Đăng ký tư vấn lộ trình học
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Chuyên viên học thuật sẽ liên hệ hỗ trợ bạn kiểm tra trình độ &amp; xây dựng lộ trình miễn phí.
                </p>

                {formSubmitted ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs sm:text-sm font-semibold text-center space-y-1">
                    <div className="text-emerald-600 text-base font-bold">✓ Đăng ký thành công!</div>
                    <p>EduVerse đã tiếp nhận thông tin và sẽ liên hệ hỗ trợ bạn trong vòng 15-30 phút.</p>
                  </div>
                ) : (
                  <form onSubmit={handleAdvisorySubmit} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Họ và tên của bạn *"
                        value={advisoryForm.name}
                        onChange={(e) => setAdvisoryForm({ ...advisoryForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="Số điện thoại liên hệ *"
                        value={advisoryForm.phone}
                        onChange={(e) => setAdvisoryForm({ ...advisoryForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Khu vực học (Tỉnh/Thành phố)"
                        value={advisoryForm.address}
                        onChange={(e) => setAdvisoryForm({ ...advisoryForm, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <select
                        value={advisoryForm.subject}
                        onChange={(e) => setAdvisoryForm({ ...advisoryForm, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-700"
                      >
                        <option value="">Chương trình bạn quan tâm</option>
                        <option value="ielts">Luyện thi IELTS (Target 6.5 - 7.5+)</option>
                        <option value="toeic">Luyện thi TOEIC (Target 750 - 850+)</option>
                        <option value="math12">Toán học Lớp 10 - 11 - 12 (Ôn thi 9+)</option>
                        <option value="lit12">Ngữ văn THPT &amp; Kỹ năng Đọc hiểu</option>
                        <option value="dgnl">Luyện thi Đánh giá Năng lực (HSA/APT)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs hover:shadow transition-all active:scale-95"
                    >
                      Đăng ký tư vấn miễn phí
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🛠️ 6. HỆ SINH THÁI CÔNG CỤ HỌC TẬP THÔNG MINH (Study Tools) */}
      <section className="py-12 bg-white border-b border-slate-200" id="tools">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
              Tính năng vượt trội
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Bộ công cụ học tập &amp; Luyện đề thế hệ mới
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Tối ưu hiệu suất học tập, ghi nhớ kiến thức bền vững và tự tin trước mọi kỳ thi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Tool 1: Tra cứu & Sổ tay bài học */}
            <div className="group relative p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-primary/50 shadow-xs hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-sky-100/80 transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-[14.5px] tracking-tight leading-snug group-hover:text-primary transition-colors">
                  Tra cứu &amp; Sổ tay bài học
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                Tra cứu nhanh định nghĩa, khái niệm và công thức trọng tâm khi làm bài. Tự động lưu vào sổ tay học tập cá nhân để ôn luyện mọi lúc.
              </p>
            </div>

            {/* Tool 2: Thẻ ghi nhớ & Ôn tập nhanh */}
            <div className="group relative p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-primary/50 shadow-xs hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-emerald-100/80 transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-[14.5px] tracking-tight leading-snug group-hover:text-primary transition-colors">
                  Thẻ ghi nhớ &amp; Ôn tập nhanh
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                Hệ thống thẻ ghi nhớ thông minh giúp học sinh ôn tập công thức và bài học cốt lõi, tăng cường khả năng ghi nhớ kiến thức sâu bền.
              </p>
            </div>

            {/* Tool 3: Hướng dẫn giải & Sửa lỗi */}
            <div className="group relative p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-primary/50 shadow-xs hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-purple-100/80 transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-[14.5px] tracking-tight leading-snug group-hover:text-primary transition-colors">
                  Hướng dẫn giải &amp; Sửa lỗi
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                Phân tích phương pháp giải bài cho từng câu hỏi, giải thích rõ ràng nguyên nhân chọn đáp án đúng và chỉ ra lỗi sai thường gặp để tiến bộ nhanh.
              </p>
            </div>

            {/* Tool 4: Phòng thi thử & Luyện đề */}
            <div className="group relative p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-primary/50 shadow-xs hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-amber-100/80 transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-[14.5px] tracking-tight leading-snug group-hover:text-primary transition-colors">
                  Phòng thi thử &amp; Luyện đề
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                Luyện đề bấm giờ theo đúng cấu trúc và thời gian của kỳ thi thật. Chấm điểm tức thì cùng nhận xét kết quả giúp học sinh tự tin bứt phá điểm số.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 👥 7. CỘNG ĐỒNG HƠN 500.000+ HỌC VIÊN (Chuẩn Study4 Community Section) */}
      <section className="py-12 bg-white border-b border-slate-200" id="community">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Luyện thi không giới hạn - và hơn 500,000 học viên hoạt động mỗi tháng
            </h2>

            {/* Avatars Stack (Study4 Style) */}
            <div className="flex items-center justify-center mt-3 mb-2 gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Học viên 1" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Học viên 2" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="Học viên 3" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="Học viên 4" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80" alt="Học viên 5" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Cộng đồng học sinh &amp; sĩ tử năng động</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual banner bên trái */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm">
                    EV
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">Diễn đàn trao đổi bài tập</h4>
                    <p className="text-[11px] text-slate-500">Hơn 12,000 câu hỏi được thảo luận mỗi ngày</p>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                  <div className="font-bold text-slate-800">Câu 38: Phương pháp tọa độ hóa Oxyz...</div>
                  <p className="text-slate-500 text-[11px]">"Trợ giảng EduVerse đã hướng dẫn cách đặt trục cực nhanh tiết kiệm 3 phút làm bài!"</p>
                  <span className="text-[10px] text-primary font-semibold">Đã có 18 lượt phản hồi hữu ích</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                  <div className="font-bold text-slate-800">IELTS Writing Task 2: AI Scoring 7.5</div>
                  <p className="text-slate-500 text-[11px]">"Nhận xét chi tiết phần Lexical Resource và Coherence sau 10 giây nộp bài."</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Đã được giáo viên xác thực</span>
                </div>
              </div>
            </div>

            {/* Checklist 4 điểm mạnh tương tác */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Cộng đồng học sinh và luyện thi sôi nổi với hơn 500,000 lượt truy cập
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Học sinh các trường THPT Chuyên và đại học trên toàn quốc cùng học tập, thảo luận phương pháp học hiệu quả.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Đặt câu hỏi và nhận giải đáp từ trợ giảng chuyên môn sau 15-30 phút
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Đội ngũ trợ giảng IELTS 8.0+ và thủ khoa khối A00, D01 hỗ trợ giải đáp trực tiếp dưới từng câu hỏi trong đề thi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Luyện tập kỹ năng nói &amp; viết nhận nhận xét tức thì
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Trợ lý AI phân tích phát âm từng âm tiết và chấm điểm bài viết theo từng tiêu chí chấm thi chính thức.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Chia sẻ chiến thuật phòng thi và ngân hàng đề thi thử độc quyền
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Thường xuyên cập nhật ma trận đề thi khảo sát từ các Sở GD&amp;ĐT và trường THPT trọng điểm.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs hover:shadow transition-all"
                >
                  Tham gia cộng đồng ngay →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏆 8. BẢNG VINH DANH THÀNH TÍCH SĨ TỬ (Student Hall of Fame) */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
              Thành tích ấn tượng
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Học viên EduVerse bứt phá điểm số
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Hàng nghìn học viên đã đạt mục tiêu IELTS 7.5+, 8.0+ và đỗ các trường Đại học Top đầu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Review 1 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  ★★★★★
                </div>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed italic">
                  "Tính năng Dictation chép chính tả và phòng thi thử bấm giờ của EduVerse giống 100% thi thật trên máy. Mình tăng từ 6.5 lên 8.0 IELTS Listening chỉ sau 2 tháng luyện đề."
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-primary font-bold flex items-center justify-center text-xs">
                  LN
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Lê Hoàng Nam</div>
                  <div className="text-[11px] text-primary font-semibold">IELTS 8.0 Overall (L 8.5, R 8.5)</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  ★★★★★
                </div>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed italic">
                  "Ma trận đề thi Toán 12 theo format mới với câu hỏi đúng/sai và trả lời ngắn rất sát đề thi Bộ. Giải thích chi tiết từng câu giúp em không bị bỡ ngỡ khi làm bài thi chính thức."
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-xs">
                  TT
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Nguyễn Thu Trang</div>
                  <div className="text-[11px] text-emerald-600 font-semibold">Thủ khoa Khối A00 (Toán 9.8 - Lý 9.75)</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  ★★★★★
                </div>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed italic">
                  "Khóa HSA Master định hướng phần tư duy định lượng và giải quyết vấn đề cực kỳ thông minh. Cảm ơn EduVerse đã giúp em đạt 118/150 điểm ĐGNL ĐHQGHN để vào thẳng Bách Khoa."
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center text-xs">
                  ĐM
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">Trần Đức Minh</div>
                  <div className="text-[11px] text-purple-600 font-semibold">Á khoa ĐGNL ĐHQGHN (HSA 118/150)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
