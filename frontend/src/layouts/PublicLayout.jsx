import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import FloatingWidgets from '../components/common/FloatingWidgets';
import AnnouncementBanner from '../components/common/AnnouncementBanner';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col relative antialiased bg-[#f8fafc]">
      <AnnouncementBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingWidgets />
    </div>
  );
}
