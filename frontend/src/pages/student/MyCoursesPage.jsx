import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { PortalHeader, Button, Card, Badge, Field } from '../../components/portal/PortalUI';
import { courseService } from '../../services/courseService';

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const res = await courseService.getCourses({ limit: 20 });
        setCourses(res?.items || []);
      } catch (error) {
        console.error('Load student courses failed:', error);
        setCourses([]);
        setErrorMessage(error?.message || 'Không thể tải danh sách khóa học.');
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  const filtered = useMemo(() => {
    const text = query.toLowerCase();
    return courses.filter((course) => (course.title || '').toLowerCase().includes(text));
  }, [courses, query]);

  return (
    <>
      <PortalHeader
        eyebrow="MY LEARNING"
        title="Khóa học đang mở"
        desc="Khám phá các khóa học đã được phê duyệt và nội dung bài học."
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(true)}><Plus size={17} /> Nhập mã lớp</Button>
            <Button onClick={() => navigate('/courses')}>Khám phá khóa học</Button>
          </>
        }
      />

      <div className="filter-bar">
        <div className="tabs">
          <button className="tab active" type="button">Tất cả <b>{courses.length}</b></button>
        </div>
        <div className="search-mini">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm khóa học..." />
        </div>
      </div>

      {errorMessage && <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c' }}>{errorMessage}</div>}
      <div className="course-list">
        {loading ? (
          <div style={{ padding: '1.5rem', color: '#475569' }}>Đang tải khóa học...</div>
        ) : errorMessage ? null : filtered.length === 0 ? (
          <div style={{ padding: '1.5rem', color: '#475569' }}>Không có khóa học phù hợp.</div>
        ) : (
          filtered.map((course) => (
            <Card key={course.id} className="course-row">
              <div className={`course-cover c${course.id.length % 3}`}>{(course.title || 'EDU').slice(0, 4).toUpperCase()}</div>
              <div className="course-info">
                <Badge tone={course.status === 'published' ? 'green' : 'gray'}>{course.status === 'published' ? 'Đang học' : course.status}</Badge>
                <h3>{course.title}</h3>
                <p>Giảng viên: {course.owner?.fullName || 'Chưa cập nhật'}</p>
                <small>{course.totalLessons || 0} bài học · Tiến độ hiển thị sau khi tham gia lớp</small>
              </div>
              <Button
                variant="ghost"
                disabled={!course.firstLessonId}
                onClick={() => navigate(`/student/courses/${course.id}/learn/${course.firstLessonId}`)}
              >
                {course.firstLessonId ? 'Xem bài học' : 'Chưa có bài học'}
              </Button>
            </Card>
          ))
        )}
      </div>

      {open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h2>Nhập mã lớp học</h2>
              <button type="button" onClick={() => setOpen(false)}>×</button>
            </div>
            <p>Chức năng tham gia lớp bằng mã sẽ được kết nối trong Sprint 4.</p>
            <Field label="Mã lớp" placeholder="VD: REACT-2026-A01" />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
              <Button disabled>Sắp có ở Sprint 4</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
