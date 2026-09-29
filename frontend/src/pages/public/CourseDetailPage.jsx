import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { findCourse } from '../../data/mockCourses';
import { toast } from '../../components/common/Toast';

const curriculum = [
  { t: 'Chương 1: Giới thiệu & lộ trình', l: ['Tổng quan khóa học', 'Cách học hiệu quả', 'Kiểm tra đầu vào'] },
  { t: 'Chương 2: Kiến thức nền tảng', l: ['Bài 1: Khái niệm cốt lõi', 'Bài 2: Ví dụ minh hoạ', 'Bài 3: Bài tập vận dụng'] },
  { t: 'Chương 3: Luyện đề & tổng ôn', l: ['Đề thi thử số 1', 'Đề thi thử số 2', 'Tổng kết & chiến thuật'] },
];

export default function CourseDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [open, setOpen] = useState(0);
  const c = findCourse(id);

  if (!c) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-slate-600">Không tìm thấy khóa học.</p>
        <Link to="/courses" className="text-primary font-semibold hover:underline">← Về danh sách khóa học</Link>
      </div>
    );
  }
  const enroll = () => { toast.info('Vui lòng đăng nhập để đăng ký học'); nav('/auth/login'); };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <div className="space-y-3">
          <Link to="/courses" className="text-body-md text-primary hover:underline">← Tất cả khóa học</Link>
          <h1 className="text-display text-slate-900">{c.title}</h1>
          <p className="text-slate-600">Giảng viên: <b>{c.instructor}</b> · ⭐ {c.rating} ({c.reviewCount} đánh giá) · {c.lessonCount}</p>
        </div>
        <img src={c.thumbnail} alt={c.title} className="w-full aspect-video object-cover rounded-2xl border border-slate-200" />
        <section className="space-y-3">
          <h2 className="text-headline-md text-slate-900">Nội dung khóa học</h2>
          {curriculum.map((ch, i) => (
            <div key={ch.t} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex justify-between items-center px-4 py-3 text-left font-semibold">
                {ch.t}<span>{open === i ? '−' : '+'}</span>
              </button>
              {open === i && <ul className="px-4 pb-3 space-y-1.5 text-body-md text-slate-600">{ch.l.map((x) => <li key={x}>▶ {x}</li>)}</ul>}
            </div>
          ))}
        </section>
      </div>
      <aside className="lg:sticky lg:top-24 h-fit bg-white border border-slate-200 rounded-2xl shadow-popover p-6 space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-primary">{c.price}</span>
          {c.originalPrice && <span className="line-through text-slate-400">{c.originalPrice}</span>}
        </div>
        <button onClick={enroll} className="w-full h-11 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold">Đăng ký học ngay</button>
        <ul className="text-body-md text-slate-600 space-y-1.5"><li>✓ {c.lessonCount}</li><li>✓ Học mọi lúc, mọi nơi</li><li>✓ Chấm điểm &amp; giải thích tức thì</li></ul>
      </aside>
    </div>
  );
}
