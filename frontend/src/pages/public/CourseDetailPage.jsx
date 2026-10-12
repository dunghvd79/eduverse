import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, LockKeyhole } from 'lucide-react';
import courseService from '../../services/courseService';
import { toast } from '../../components/common/Toast';

export default function CourseDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [open, setOpen] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      courseService.get(id),
      courseService.curriculum(id)
    ]).then(([detail, outline]) => {
      if (!cancelled) {
        setCourse(detail);
        setCurriculum(outline);
      }
    }).catch(error => {
      if (!cancelled) toast.error(error?.message || 'Không thể tải khóa học.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="py-24 text-center text-slate-500">Đang tải khóa học...</div>;
  }

  if (!course) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-slate-600">Không tìm thấy khóa học.</p>
        <Link to="/courses" className="text-primary font-semibold hover:underline">← Về danh sách khóa học</Link>
      </div>
    );
  }

  const enroll = () => {
    toast.info('Chức năng ghi danh lớp sẽ được kết nối ở phần Classes/Enrollments.');
    nav('/auth/login');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <div className="space-y-3">
          <Link to="/courses" className="text-body-md text-primary hover:underline">← Tất cả khóa học</Link>
          {course.category && (
            <Link
              to={`/courses?category=${course.category.slug}`}
              className="ml-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              {course.category.name}
            </Link>
          )}
          <h1 className="text-display text-slate-900">{course.title}</h1>
          <p className="text-slate-600">
            Giảng viên: <b>{course.owner?.fullName || 'Đội ngũ EduVerse'}</b>
            {' · '}{course.totalChapters || 0} chương · {course.totalLessons || 0} bài học
          </p>
        </div>

        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full aspect-video object-cover rounded-2xl border border-slate-200" />
        ) : (
          <div className="w-full aspect-video rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            EduVerse Course
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-headline-md text-slate-900">Nội dung khóa học</h2>
          {(curriculum?.chapters || []).map((chapter, i) => (
            <div key={chapter.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex justify-between items-center px-4 py-3 text-left font-semibold"
              >
                <span>{i + 1}. {chapter.title}</span>
                {open === i ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
              </button>
              {open === i && (
                <ul className="px-4 pb-4 space-y-2 text-body-md text-slate-600">
                  {(chapter.lessons || []).map(lesson => (
                    <li key={lesson.id} className="flex items-center gap-2">
                      <span className="text-primary">•</span>
                      <span>{lesson.title}</span>
                      <span className="ml-auto text-xs text-slate-400">{lesson.lessonType}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 h-fit bg-white border border-slate-200 rounded-2xl shadow-popover p-6 space-y-4">
        <div className="text-3xl font-extrabold text-primary">
          {Number(course.price) === 0 ? 'Miễn phí' : `${Number(course.price).toLocaleString('vi-VN')}đ`}
        </div>
        <button onClick={enroll} className="w-full h-11 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold">
          Đăng ký học ngay
        </button>
        <ul className="text-body-md text-slate-600 space-y-2">
          <li>✓ {course.totalLessons || 0} bài học</li>
          <li>✓ Học mọi lúc, mọi nơi</li>
          <li><LockKeyhole size={15} className="inline mr-1"/> Nội dung dành cho học viên đã ghi danh</li>
        </ul>
      </aside>
    </div>
  );
}
