import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import HomePage from '../pages/public/HomePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<div className="max-w-[1440px] mx-auto px-4 py-16 text-center text-slate-600">Trang Khám phá Khóa học (Đang hoàn thiện)</div>} />
        <Route path="/courses/:id" element={<div className="max-w-[1440px] mx-auto px-4 py-16 text-center text-slate-600">Trang Chi tiết Khóa học (Đang hoàn thiện)</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
