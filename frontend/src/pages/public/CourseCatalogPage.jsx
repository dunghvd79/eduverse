import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CourseCard from '../../components/course/CourseCard';
import courseService from '../../services/courseService';
import categoryService from '../../services/categoryService';
import { toast } from '../../components/common/Toast';

const PAGE_SIZE = 8;

export default function CourseCatalogPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const status = 'published';
  const page = Number(params.get('page') || 1);
  const category = params.get('category') || '';
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(q);

  useEffect(() => {
    setSearchTerm(q);
  }, [q]);

  useEffect(() => {
    categoryService.list()
      .then(data => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await courseService.list({
          page,
          limit: PAGE_SIZE,
          search: q,
          status,
          ...(category ? { category } : {})
        });

        if (!cancelled) {
          setCourses(data.items || []);
          setMeta(data.meta);
        }
      } catch (error) {
        if (!cancelled) toast.error(error?.message || 'Không thể tải danh sách khóa học.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [q, page, category]);

  const shown = useMemo(() => courses.map(course => ({
    id: course.id,
    slug: course.slug || course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnailUrl || course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    lessonCount: course.totalLessons ? `${course.totalLessons} bài học` : (course.lesson_count ? `${course.lesson_count} bài học` : 'Nhiều bài giảng'),
    instructor: course.owner?.fullName || course.owner?.name || 'Đội ngũ Giảng viên EduVerse',
    price: Number(course.price) === 0 ? 'Miễn phí' : `${Number(course.price).toLocaleString('vi-VN')}đ`,
    originalPrice: course.original_price ? `${Number(course.original_price).toLocaleString('vi-VN')}đ` : null,
    discount: course.discount || null,
    rating: course.rating || '4.9',
    reviewCount: course.review_count || '120',
    studentCount: course.student_count ? `${course.student_count.toLocaleString()} Học viên` : 'Học viên tích cực',
    badge: course.badge || course.category?.name || (course.status === 'published' ? 'Đang mở' : null),
    badgeType: course.badgeType || 'brand'
  })), [courses]);

  const setQuery = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value); else next.delete('q');
    next.set('page', '1');
    setParams(next);
  };

  const setCategory = (slug) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug); else next.delete('category');
    next.set('page', '1');
    setParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setQuery(searchTerm.trim());
  };

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* 🚀 1. HERO SEARCH BANNER MANG ĐẬM THƯƠNG HIỆU EDUVERSE */}
      <section className="relative bg-gradient-to-b from-[#eaf4fd] via-[#f3f9fe] to-[#fafbfc] border-b border-sky-100/90 pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-primary/5 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-sky-200 text-primary font-bold text-xs uppercase tracking-wider shadow-2xs backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Thư viện Khóa học &amp; Luyện thi EduVerse
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Khám phá &amp; Lựa chọn Khóa học chất lượng cao
          </h1>

          <p className="text-slate-600 text-xs sm:text-[15px] max-w-2xl mx-auto leading-relaxed">
            Hơn 200+ chương trình học bản quyền, ôn luyện bám sát ma trận thi mới của Bộ GD&amp;ĐT cùng chứng chỉ IELTS, TOEIC &amp; ĐGNL 2026.
          </p>

          {/* Ô Tìm Kiếm Cao Cấp Mang Thương Hiệu EduVerse */}
          <div className="pt-2 max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center bg-white rounded-2xl shadow-lg shadow-sky-900/5 border border-sky-200/90 p-2 sm:p-2.5 transition-all focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary"
            >
              {/* Icon kính lúp thương hiệu */}
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-primary flex items-center justify-center flex-shrink-0 ml-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Input tìm kiếm */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm khóa học, đề thi, chuyên đề (VD: IELTS, Toán 12, ĐGNL...)"
                className="w-full px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none font-medium"
              />

              {/* Nút xóa nhanh nếu có text */}
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setQuery('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg mr-1 cursor-pointer transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Nút tìm kiếm EduVerse */}
              <button
                type="submit"
                className="flex-shrink-0 px-5 sm:px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Tìm kiếm</span>
              </button>
            </form>

            {/* Tags gợi ý từ khóa tìm kiếm nhanh */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-3.5 text-[11.5px] sm:text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Từ khóa gợi ý:</span>
              {['IELTS 7.0+', 'TOEIC 850+', 'Toán 12', 'ĐGNL HSA', 'Ngữ văn 2026'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchTerm(tag);
                    setQuery(tag);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-primary font-medium border border-sky-200/80 shadow-2xs transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 📂 2. BỘ LỌC DANH MỤC & LƯỚI KHÓA HỌC */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
        {/* Thanh Tabs Danh mục */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[{ slug: '', name: 'Tất cả chương trình' }, ...categories].map((cat) => {
            const isSelected = (!category && !cat.slug) || (category === cat.slug);
            return (
              <button
                key={cat.slug || 'all'}
                onClick={() => setCategory(cat.slug)}
                className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                    : 'bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                }`}
              >
                {cat.name}
                {cat.courseCount !== undefined && <span className="ml-1 opacity-70">({cat.courseCount})</span>}
              </button>
            );
          })}
        </div>

        {/* Thanh đếm số lượng kết quả */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 border-b border-slate-200/80 pb-3">
          <div>
            {meta ? (
              <span>Hiển thị <strong>{shown.length}</strong> / <strong>{meta.totalItems}</strong> khóa học</span>
            ) : (
              <span>Danh sách khóa học</span>
            )}
            {q && <span> với từ khóa <strong>"{q}"</strong></span>}
          </div>

          {(q || category) && (
            <button
              onClick={() => {
                setSearchTerm('');
                const next = new URLSearchParams();
                setParams(next);
              }}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              Đặt lại bộ lọc ✕
            </button>
          )}
        </div>

        {/* Khung nội dung Khóa học */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs animate-pulse">
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
        ) : shown.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-200 max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-sky-50 text-primary flex items-center justify-center text-2xl shadow-2xs">
              🔍
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Không tìm thấy khóa học phù hợp
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
              Không có khóa học nào khớp với từ khóa hoặc danh mục đã chọn. Hãy thử tìm kiếm với từ khóa khác nhé.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setParams(new URLSearchParams());
              }}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              Xem tất cả khóa học
            </button>
          </div>
        )}

        {/* Phân trang */}
        {meta?.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-6">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set('page', String(n));
                  setParams(next);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  n === page
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
