import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardCheck, GraduationCap, RefreshCw, Users } from 'lucide-react';
import { PortalHeader, Button, StatCard, Card, SectionTitle, Table, Badge } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import classService, { CLASS_STATUS, formatDate } from '../../services/classService';
import assignmentService from '../../services/assignmentService';
import { toast } from '../../components/common/Toast';

const COURSE_STATUSES = [
  ['draft', 'Bản nháp', 'gray'],
  ['pending', 'Chờ duyệt', 'orange'],
  ['published', 'Đã công khai', 'green'],
  ['rejected', 'Bị từ chối', 'red']
];

const EMPTY_STATS = { courses: {}, classes: [], needsGrading: 0 };

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [courseResults, myClasses] = await Promise.all([
        Promise.all(COURSE_STATUSES.map(([status]) => courseService.list({ mine: true, status, limit: 1 }))),
        classService.myClasses()
      ]);
      const classList = myClasses || [];

      // Bài nộp cần chấm = tổng needsGradingCount của mọi bài tập trong các lớp mình phụ trách
      const assignmentResults = await Promise.all(
        classList.map(cls => assignmentService.classAssignments(cls.id).catch(() => ({ items: [] })))
      );
      const needsGrading = assignmentResults.reduce(
        (sum, result) => sum + (result?.items || []).reduce((s, item) => s + (item.stats?.needsGradingCount || 0), 0),
        0
      );

      setStats({
        courses: Object.fromEntries(COURSE_STATUSES.map(([status], index) => [status, courseResults[index]?.meta?.totalItems ?? 0])),
        classes: classList,
        needsGrading
      });
    } catch (error) {
      toast.error(error?.message || 'Không thể tải số liệu giảng dạy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalCourses = COURSE_STATUSES.reduce((sum, [status]) => sum + (stats.courses[status] || 0), 0);
  const totalStudents = stats.classes.reduce((sum, cls) => sum + (cls.totalStudents || 0), 0);
  const show = (value) => (loading ? '…' : value);

  const todos = [
    { key: 'grading', count: stats.needsGrading, text: 'bài nộp cần chấm', to: '/teacher/assignments', tone: 'orange' },
    { key: 'rejected', count: stats.courses.rejected || 0, text: 'khóa học bị từ chối, cần chỉnh sửa', to: '/teacher/courses', tone: 'red' },
    { key: 'pending', count: stats.courses.pending || 0, text: 'khóa học đang chờ duyệt', to: '/teacher/courses', tone: 'blue' }
  ].filter(item => item.count > 0);

  return (
    <>
      <PortalHeader
        eyebrow="TEACHER PORTAL"
        title="Tổng quan giảng dạy"
        desc="Theo dõi khóa học, lớp học và công việc chấm điểm."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              <RefreshCw size={16} /> Làm mới
            </Button>
            <Button onClick={() => navigate('/teacher/courses')}>
              <BookOpen size={17} /> Khóa học của tôi
            </Button>
          </>
        }
      />

      <div className="stats-grid">
        <StatCard icon={BookOpen} label="Khóa học của tôi" value={show(totalCourses)} />
        <StatCard icon={GraduationCap} label="Lớp phụ trách" value={show(stats.classes.length)} />
        <StatCard icon={Users} label="Học viên" value={show(totalStudents)} sub="Tổng các lớp" />
        <StatCard icon={ClipboardCheck} label="Bài chờ chấm" value={show(stats.needsGrading)} />
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionTitle title="Cần xử lý" />
          {loading ? (
            <div className="p-6 text-center text-slate-500">Đang tải...</div>
          ) : todos.length === 0 ? (
            <div className="p-6 text-center text-slate-500">Hiện không có việc nào cần xử lý.</div>
          ) : (
            todos.map(item => (
              <div className="task cursor-pointer" key={item.key} onClick={() => navigate(item.to)}>
                <div className="task-dot" />
                <div><b>{item.count} {item.text}</b></div>
                <Badge tone={item.tone}>Xem</Badge>
              </div>
            ))
          )}
        </Card>

        <Card>
          <SectionTitle
            title="Khóa học theo trạng thái"
            action={<Button variant="ghost" onClick={() => navigate('/teacher/courses')}>Quản lý</Button>}
          />
          {COURSE_STATUSES.map(([status, label, tone]) => (
            <div className="health-row" key={status}>
              <span>{label}</span>
              <Badge tone={tone}>{show(stats.courses[status] || 0)}</Badge>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Lớp học của tôi"
          action={<Button variant="ghost" onClick={() => navigate('/teacher/classes')}>Xem tất cả</Button>}
        />
        {loading ? (
          <div className="p-6 text-center text-slate-500">Đang tải...</div>
        ) : stats.classes.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Bạn chưa phụ trách lớp học nào.</div>
        ) : (
          <Table
            headers={['Lớp', 'Khóa học', 'Học viên', 'Khai giảng', 'Trạng thái']}
            rows={stats.classes.slice(0, 5).map(cls => {
              const [label, tone] = CLASS_STATUS[cls.status] || [cls.status, 'gray'];
              return [
                <b>{cls.name}</b>,
                cls.course?.title || '—',
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