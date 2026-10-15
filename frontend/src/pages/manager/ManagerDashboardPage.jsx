import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardCheck, FolderTree, GraduationCap, RefreshCw } from 'lucide-react';
import { PortalHeader, Button, StatCard, Progress, Card, SectionTitle, Table, Badge } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import classService, { CLASS_STATUS, formatDate } from '../../services/classService';
import categoryService from '../../services/categoryService';
import { toast } from '../../components/common/Toast';

const EMPTY_STATS = { pending: 0, published: 0, categories: 0, classes: { active: 0, paused: 0, closed: 0 } };

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [recentClasses, setRecentClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [pending, published, active, paused, closed, recent, categories] = await Promise.all([
        courseService.list({ status: 'pending', limit: 5 }),
        courseService.list({ status: 'published', limit: 1 }),
        classService.list({ status: 'active', limit: 1 }),
        classService.list({ status: 'paused', limit: 1 }),
        classService.list({ status: 'closed', limit: 1 }),
        classService.list({ limit: 5 }),
        categoryService.list({ includeHidden: true })
      ]);
      setStats({
        pending: pending.meta?.totalItems ?? 0,
        published: published.meta?.totalItems ?? 0,
        categories: (categories || []).length,
        classes: {
          active: active.meta?.totalItems ?? 0,
          paused: paused.meta?.totalItems ?? 0,
          closed: closed.meta?.totalItems ?? 0
        }
      });
      setPendingCourses(pending.items || []);
      setRecentClasses(recent.items || []);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải số liệu tổng quan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalClasses = stats.classes.active + stats.classes.paused + stats.classes.closed;
  const activePercent = totalClasses ? Math.round((stats.classes.active / totalClasses) * 100) : 0;
  const show = (value) => (loading ? '…' : value);

  return (
    <>
      <PortalHeader
        eyebrow="TRAINING MANAGEMENT"
        title="Tổng quan đào tạo"
        desc="Giám sát chất lượng nội dung và hoạt động học tập toàn hệ thống."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw size={16} /> Làm mới
          </Button>
        }
      />

      <div className="stats-grid">
        <StatCard icon={ClipboardCheck} label="Khóa chờ duyệt" value={show(stats.pending)} />
        <StatCard icon={BookOpen} label="Khóa đã công khai" value={show(stats.published)} />
        <StatCard icon={GraduationCap} label="Lớp đang hoạt động" value={show(stats.classes.active)} />
        <StatCard icon={FolderTree} label="Danh mục khóa học" value={show(stats.categories)} />
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionTitle
            title="Khóa học cần duyệt"
            action={<Button variant="ghost" onClick={() => navigate('/manager/approvals')}>Xem hàng đợi</Button>}
          />
          {loading ? (
            <div className="p-6 text-center text-slate-500">Đang tải...</div>
          ) : pendingCourses.length === 0 ? (
            <div className="p-6 text-center text-slate-500">Không có khóa nào đang chờ duyệt.</div>
          ) : (
            pendingCourses.map(course => (
              <div
                className="approval-item cursor-pointer"
                key={course.id}
                onClick={() => navigate(`/manager/approvals/${course.id}/review`)}
              >
                <div className="approval-cover">EDU</div>
                <div>
                  <b>{course.title}</b>
                  <small>
                    GV {course.owner?.fullName || '—'} · cập nhật {course.updatedAt ? new Date(course.updatedAt).toLocaleString('vi-VN') : '—'}
                  </small>
                </div>
                <Badge tone="orange">Chờ duyệt</Badge>
              </div>
            ))
          )}
        </Card>

        <Card>
          <SectionTitle
            title="Lớp học"
            action={<Button variant="ghost" onClick={() => navigate('/manager/classes')}>Xem tất cả</Button>}
          />
          <div className="big-number">{show(totalClasses)}</div>
          <Progress value={activePercent} />
          <div className="mini-stats">
            <span><b>{show(stats.classes.active)}</b><small>Đang hoạt động</small></span>
            <span><b>{show(stats.classes.paused)}</b><small>Tạm dừng</small></span>
            <span><b>{show(stats.classes.closed)}</b><small>Đã kết thúc</small></span>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Lớp học mới nhất" />
        {loading ? (
          <div className="p-6 text-center text-slate-500">Đang tải...</div>
        ) : recentClasses.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Chưa có lớp học nào.</div>
        ) : (
          <Table
            headers={['Lớp', 'Khóa học', 'Giảng viên', 'Học viên', 'Khai giảng', 'Trạng thái']}
            rows={recentClasses.map(cls => {
              const [label, tone] = CLASS_STATUS[cls.status] || [cls.status, 'gray'];
              return [
                <b>{cls.name}</b>,
                cls.course?.title || '—',
                cls.teacher?.fullName || '—',
                cls.totalStudents ?? 0,
                formatDate(cls.startDate),
                <Badge tone={tone}>{label}</Badge>
              ];
            })}
          />
        )}
      </Card>
    </>
  );
}