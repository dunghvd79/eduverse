import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import CourseCard from '../../components/course/CourseCard';
import { categories, courses } from '../../data/mockCourses';

const PAGE_SIZE = 6;
const subjectMap = { english: 'english', thpt: null, exam: 'exam' };

export default function CourseCatalogPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const cat = params.get('subject') || (params.get('type') === 'exam' ? 'exam' : 'all');
  const price = params.get('price') || 'all';
  const sort = params.get('sort') || 'popular';
  const page = Number(params.get('page') || 1);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: 1, ...patch }).forEach(([k, v]) => (v && v !== 'all' ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  const list = useMemo(() => {
    let r = courses.filter((c) => (cat === 'all' || c.category === (subjectMap[cat] ?? cat)) && c.title.toLowerCase().includes(q.toLowerCase()));
    if (price === 'free') r = r.filter((c) => c.priceValue === 0);
    if (price === 'paid') r = r.filter((c) => c.priceValue > 0);
    if (sort === 'price-asc') r = [...r].sort((a, b) => a.priceValue - b.priceValue);
    if (sort === 'rating') r = [...r].sort((a, b) => Number(b.rating) - Number(a.rating));
    return r;
  }, [q, cat, price, sort]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sel = 'h-10 px-3 rounded-lg border border-slate-300 bg-white text-body-md';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-headline-lg text-slate-900">Khám phá khóa học</h1>
        <p className="text-slate-600">{list.length} khóa học phù hợp</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <input value={q} onChange={(e) => set({ q: e.target.value })} placeholder="Tìm kiếm khóa học..." className={`${sel} flex-1 min-w-[220px]`} />
        <select value={price} onChange={(e) => set({ price: e.target.value })} className={sel}>
          <option value="all">Mọi mức giá</option><option value="free">Miễn phí</option><option value="paid">Có phí</option>
        </select>
        <select value={sort} onChange={(e) => set({ sort: e.target.value })} className={sel}>
          <option value="popular">Phổ biến</option><option value="rating">Đánh giá cao</option><option value="price-asc">Giá tăng dần</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c.id} onClick={() => set({ subject: c.id })}
            className={`px-4 py-1.5 rounded-full border text-label-md ${cat === c.id ? 'bg-primary text-white border-primary' : 'bg-white border-slate-300 text-slate-700 hover:border-primary'}`}>{c.label}</button>
        ))}
      </div>
      {shown.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{shown.map((c) => <CourseCard key={c.id} course={c} />)}</div>
      ) : (
        <p className="py-16 text-center text-slate-500">Không tìm thấy khóa học phù hợp.</p>
      )}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setParams(new URLSearchParams({ ...Object.fromEntries(params), page: n }))}
              className={`w-10 h-10 rounded-lg border ${n === page ? 'bg-primary text-white border-primary' : 'bg-white border-slate-300'}`}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}
