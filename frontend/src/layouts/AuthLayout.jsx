import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-sky-50 px-4 py-10">
      <Link to="/" className="mb-6 text-2xl font-extrabold tracking-tight text-slate-900">
        Edu<span className="text-primary">Verse</span>
      </Link>
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-drawer p-6 md:p-8">
        <Outlet />
      </div>
    </div>
  );
}
