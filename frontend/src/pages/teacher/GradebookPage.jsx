import React from 'react';
import ClassManagePage from '../../components/class/ClassManagePage';

// Link cũ /teacher/classes/:id/gradebook -> trang lớp, mở sẵn tab "Bảng điểm"
export default function GradebookPage() {
  return <ClassManagePage basePath="/teacher/classes" initialTab="gradebook" />;
}
