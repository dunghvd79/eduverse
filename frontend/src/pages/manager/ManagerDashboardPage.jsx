import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardCheck, Users, GraduationCap, CheckCircle2 } from 'lucide-react';
import { PortalHeader, Button, StatCard, Progress, Card, SectionTitle, Badge, LoadError } from '../../components/portal/PortalUI';
import { toast } from '../../components/common/Toast';
import dashboardService from '../../services/dashboardService';
import { CLASS_STATUS } from '../../services/classService';
import { formatDateTime } from '../../services/quizService';

const teacherName = (course) => course.teacher?.fullName || 'Không rõ giảng viên';

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await dashboardService.manager());
    } catch (err) {
      const message = err?.message || 'Không thể tải tổng quan đào tạo.';
      setError(message);
      toast.error(message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const header = <PortalHeader title="Tổng quan đào tạo" desc="Giám sát chất lượng nội dung và hoạt động học tập toàn hệ thống." />;

  if (error && !data) {
    return <>{header}<LoadError message={error} onRetry={load} /></>;
  }
  if (!data) return <>{header}<div className="p-10 text-center text-slate-500">Đang tải tổng quan...</div></>;

  const { stats, pendingQueue, classesByStatus, recentlyApproved } = data;
  return <>
    {header}
    <div className="stats-grid">
      <StatCard icon={ClipboardCheck} label="Khóa chờ duyệt" value={stats.pendingCourses} />
      <StatCard icon={BookOpen} label="Khóa đã xuất bản" value={stats.publishedCourses} />
      <StatCard icon={GraduationCap} label="Lớp đang hoạt động" value={stats.activeClasses} />
      <StatCard icon={Users} label="Học viên đang học" value={stats.activeStudents} />
    </div>

    <div className="dashboard-grid">
      <Card>
        <SectionTitle title="Khóa học cần duyệt" action={<Button variant="ghost" onClick={() => navigate('/manager/approvals')}>Xem hàng đợi</Button>} />
        {pendingQueue.items.length === 0 ? (
          <p className="text-sm text-slate-500">Không có khóa học nào đang chờ duyệt.</p>
        ) : <>
          {pendingQueue.items.map((course) => (
            <div className="approval-item cursor-pointer" key={course.id} onClick={() => navigate(`/manager/approvals/${course.id}/review`)}>
              {course.thumbnailUrl
                ? <img src={course.thumbnailUrl} alt={course.title} className="approval-cover object-cover" />
                : <div className="approval-cover"><BookOpen size={18} /></div>}
              <div>
                <b>{course.title}</b>
                <small>{teacherName(course)}{course.category ? ` · ${course.category}` : ''} · gửi {formatDateTime(course.submittedAt)}</small>
              </div>
              <Badge tone="orange">Chờ duyệt</Badge>
            </div>
          ))}
          {pendingQueue.total > pendingQueue.items.length && <p className="text-xs text-slate-500 mt-3">Còn {pendingQueue.total - pendingQueue.items.length} khóa khác trong hàng đợi.</p>}
        </>}
      </Card>
      <Card>
        <SectionTitle title="Lớp học theo trạng thái" action={<Button variant="ghost" onClick={() => navigate('/manager/classes')}>Xem lớp học</Button>} />
        <div className="big-number">{classesByStatus.total}</div>
        {Object.entries(CLASS_STATUS).map(([status, [label]]) => (
          <div className="role-bar" key={status}>
            <div><b>{label}</b><span>{classesByStatus[status]}</span></div>
            <Progress value={classesByStatus.total ? (classesByStatus[status] / classesByStatus.total) * 100 : 0} />
          </div>
        ))}
      </Card>
    </div>

    <Card>
      <SectionTitle title="Khóa học vừa được duyệt" />
      {recentlyApproved.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có khóa học nào được duyệt.</p>
      ) : (
        <div className="activity-list">
          {recentlyApproved.map((course) => (
            <div className="activity" key={course.id}>
              <div className="activity-icon"><CheckCircle2 /></div>
              <div><b>{course.title}</b><small>{teacherName(course)} · duyệt lúc {formatDateTime(course.approvedAt)}</small></div>
            </div>
          ))}
        </div>
      )}
    </Card>
  </>;
}
