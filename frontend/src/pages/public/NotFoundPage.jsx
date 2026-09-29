import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
      <div className="text-8xl font-extrabold text-primary">404</div>
      <h1 className="text-headline-lg text-slate-900">Không tìm thấy trang</h1>
      <p className="text-slate-600">Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      <form onSubmit={(e) => { e.preventDefault(); nav(`/courses?q=${encodeURIComponent(q)}`); }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm khóa học..." className="flex-1 h-11 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <button className="px-5 rounded-lg bg-primary text-white font-semibold">Tìm</button>
      </form>
      <Link to="/" className="inline-block text-primary font-semibold hover:underline">← Về trang chủ</Link>
    </div>
  );
}
