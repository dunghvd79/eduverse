import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CourseCard from '../../components/course/CourseCard';
import courseService from '../../services/courseService';
import categoryService from '../../services/categoryService';
import { toast } from '../../components/common/Toast';

const PAGE_SIZE = 6;

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
    slug: course.slug,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnailUrl,
    lessonCount: `${course.totalLessons || 0} bài học`,
    instructor: course.owner?.fullName || 'Đội ngũ Giảng viên EduVerse',
    price: Number(course.price) === 0 ? 'Miễn phí' : `${Number(course.price).toLocaleString('vi-VN')}đ`,
    originalPrice: null,
    rating: '—',
    reviewCount: '0',
    badge: course.category?.name || (course.status === 'published' ? 'Đang mở' : null),
    badgeType: 'brand'
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

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-headline-lg text-slate-900">Khám phá khóa học</h1>
        <p className="text-slate-600">
          {meta ? `${meta.totalItems} khóa học đã xuất bản` : 'Các khóa học đang mở'}
        </p>
      </div>

      <input
        value={q}
        onChange={e => setQuery(e.target.value)}
        placeholder="Tìm kiếm theo tên hoặc mô tả..."
        className="h-11 w-full max-w-xl rounded-lg border border-slate-300 bg-white px-4 outline-none focus:border-primary"
      />

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[{ slug: '', name: 'Tất cả' }, ...categories].map(cat => (
            <button
              key={cat.slug || 'all'}
              onClick={() => setCategory(cat.slug)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                category === cat.slug
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary'
              }`}
            >
              {cat.name}
              {cat.courseCount !== undefined && <span className="ml-1 opacity-70">({cat.courseCount})</span>}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">Đang tải khóa học...</div>
      ) : shown.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map(course => <CourseCard key={course.id} course={course} />)}
        </div>
      ) : (
        <p className="py-16 text-center text-slate-500">Không tìm thấy khóa học phù hợp.</p>
      )}

      {meta?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set('page', String(n));
                setParams(next);
              }}
              className={`w-10 h-10 rounded-lg border ${n === page ? 'bg-primary text-white border-primary' : 'bg-white border-slate-300'}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
