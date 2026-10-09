import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Eye } from 'lucide-react';
import { PortalHeader, Button, Card, Table, Badge } from '../../components/portal/PortalUI';
import { courseService } from '../../services/courseService';

export default function CourseApprovalQueuePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadPending = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const res = await courseService.getCourses({ status: 'pending', limit: 50 });
        setCourses(res?.items || []);
      } catch (error) {
        console.error('Load pending courses failed:', error);
        setCourses([]);
        setErrorMessage(error?.message || 'Không thể tải hàng đợi duyệt.');
      } finally {
        setLoading(false);
      }
    };
    loadPending();
  }, []);

  return (
    <>
      <PortalHeader eyebrow="CONTENT REVIEW" title="Hàng đợi phê duyệt" desc="Kiểm tra các khóa học đang chờ được xuất bản." />
      <div className="filter-bar">
        <div className="tabs">
          <button className="tab active" type="button">Chờ duyệt {courses.length}</button>
        </div>
        <Button variant="secondary"><Filter size={16} /> Bộ lọc</Button>
      </div>

      {errorMessage && <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c' }}>{errorMessage}</div>}
      <Card>
        {loading ? (
          <div style={{ padding: '1.5rem', color: '#475569' }}>Đang tải hàng đợi duyệt...</div>
        ) : errorMessage ? null : courses.length === 0 ? (
          <div style={{ padding: '1.5rem', color: '#475569' }}>Hiện không có khóa học nào đang chờ duyệt.</div>
        ) : (
          <Table
            headers={['Khóa học', 'Giảng viên', 'Bài học', 'Gửi lúc', 'Trạng thái', 'Thao tác']}
            rows={courses.map((course) => [
              <b>{course.title}</b>,
              course.owner?.fullName || 'Chưa xác định',
              course.totalLessons || 0,
              course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : '—',
              <Badge tone="orange">Chờ duyệt</Badge>,
              <Button variant="ghost" onClick={() => navigate(`/manager/approvals/${course.id}/review`)}><Eye size={16} /> Xem</Button>
            ])}
          />
        )}
      </Card>
    </>
  );
}
