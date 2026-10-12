import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader, Button, Card, Table, Badge } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import { toast } from '../../components/common/Toast';

export default function CourseApprovalQueuePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await courseService.list({
        limit: 100,
        status: tab
      });
      setCourses(data.items || []);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải hàng đợi phê duyệt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const counts = useMemo(() => ({
    pending: courses.filter(c => c.status === 'pending').length,
    published: courses.filter(c => c.status === 'published').length,
    rejected: courses.filter(c => c.status === 'rejected').length
  }), [courses]);

  return (
    <>
      <PortalHeader
        eyebrow="CONTENT REVIEW"
        title="Hàng đợi phê duyệt"
        desc="Kiểm tra nội dung khóa học trước khi xuất bản."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw size={16} /> Làm mới
          </Button>
        }
      />

      <div className="filter-bar">
        <div className="tabs">
          {[
            ['pending', `Chờ duyệt ${counts.pending}`],
            ['published', `Đã duyệt ${counts.published}`],
            ['rejected', `Từ chối ${counts.rejected}`]
          ].map(([value, label]) => (
            <button
              key={value}
              className={`tab ${tab === value ? 'active' : ''}`}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <Button variant="secondary"><Filter size={16}/> Bộ lọc</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : courses.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            Không có khóa học trong trạng thái này.
          </div>
        ) : (
          <Table
            headers={['Khóa học', 'Danh mục', 'Giảng viên', 'Bài học', 'Cập nhật', 'Trạng thái', 'Thao tác']}
            rows={courses.map(course => [
              <b>{course.title}</b>,
              course.category?.name || <span className="text-slate-400">Chưa chọn</span>,
              course.owner?.fullName || '—',
              course.totalLessons ?? 0,
              course.updatedAt ? new Date(course.updatedAt).toLocaleString('vi-VN') : '—',
              <Badge tone={course.status === 'published' ? 'green' : course.status === 'rejected' ? 'red' : 'orange'}>
                {course.status === 'published' ? 'Đã duyệt' : course.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
              </Badge>,
              <Button variant="ghost" onClick={() => navigate(`/manager/approvals/${course.id}/review`)}>
                <Eye size={16}/> Xem
              </Button>
            ])}
          />
        )}
      </Card>
    </>
  );
}
