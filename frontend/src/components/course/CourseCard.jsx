import React from 'react';
import { Link } from 'react-router-dom';

export default function CourseCard({ course }) {
  const {
    id = '1',
    slug = 'ielts-master-7',
    thumbnail,
    badge = 'Bestseller',
    badgeType = 'rose', // rose, emerald, amber, brand
    lessonCount = '68 bài giảng',
    rating = '4.9',
    reviewCount = '1.450',
    title = 'Khóa học chất lượng cao',
    instructor = 'Đội ngũ Giảng viên EduVerse',
    price = '1.490.000đ',
    originalPrice = '2.800.000đ',
  } = course || {};

  const badgeColorMap = {
    rose: 'bg-rose-500 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
    brand: 'bg-primary text-white',
  };

  const badgeClass = badgeColorMap[badgeType] || 'bg-primary text-white';

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Thumbnail + Badges */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <img
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          src={thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'}
          loading="lazy"
        />
        {badge && (
          <span className={`absolute top-2.5 left-2.5 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badgeClass}`}>
            {badge}
          </span>
        )}
        {lessonCount && (
          <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 text-white text-[11px] font-medium px-2 py-0.5 rounded backdrop-blur-xs">
            {lessonCount}
          </span>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-1.5">
            <span>★ {rating}</span>
            <span className="text-slate-400 font-normal">({reviewCount} đánh giá)</span>
          </div>

          <Link to={`/courses/${slug || id}`} className="block">
            <h3 className="font-bold text-slate-900 group-hover:text-primary line-clamp-2 transition-colors text-sm sm:text-base leading-snug">
              {title}
            </h3>
          </Link>

          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            Giảng viên: {instructor}
          </p>
        </div>

        {/* Price & CTA */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-primary tabular-number">{price}</div>
            {originalPrice && (
              <div className="text-xs text-slate-400 line-through tabular-number">{originalPrice}</div>
            )}
          </div>
          <Link
            to={`/courses/${slug || id}`}
            className="px-3 py-1.5 bg-blue-50 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}
