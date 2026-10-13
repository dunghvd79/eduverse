import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ClipboardCheck, GraduationCap } from 'lucide-react';
import { PortalHeader, Button, StatCard, Card, SectionTitle, Table, Badge, LoadError } from '../../components/portal/PortalUI';
import { toast } from '../../components/common/Toast';
import dashboardService from '../../services/dashboardService';
import { CLASS_STATUS } from '../../services/classService';
import { formatScore, formatDateTime } from '../../services/quizService';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await dashboardService.teacher());
    } catch (err) {
      const message = err?.message || 'Không thể tải tổng quan giảng dạy.';
      setError(message);
      toast.error(message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const header = (
    <PortalHeader
      title="Tổng quan giảng dạy"
      desc="Theo dõi khóa học, lớp học và công việc chấm điểm."
      actions={<Button onClick={() => navigate('/teacher/courses')}><BookOpen size={17} /> Quản lý khóa học</Button>}
    />
  );

  if (error && !data) {
    return <>{header}<LoadError message={error} onRetry={load} /></>;
  }
  if (!data) return <>{header}<div className="p-10 text-center text-slate-500">Đang tải tổng quan...</div></>;

  const { stats, needsGrading, rejectedCourses, classes } = data;
  const nothingToHandle = needsGrading.length === 0 && rejectedCourses.length === 0;
  return <>
    {header}
    <div className="stats-grid">
      <StatCard icon={BookOpen} label="Khóa học của tôi" value={stats.courses.total} sub={`${stats.courses.published} đã xuất bản · ${stats.courses.pending} chờ duyệt`} />
      <StatCard icon={GraduationCap} label="Lớp đang dạy" value={stats.activeClasses} sub={`Tổng ${stats.totalClasses} lớp`} />
      <StatCard icon={Users} label="Học viên đang học" value={stats.activeStudents} />
      <StatCard icon={ClipboardCheck} label="Bài chờ chấm" value={stats.submissionsNeedGrading} />
    </div>

    <Card>
      <SectionTitle title="Cần xử lý" />
      {nothingToHandle ? (
        <p className="text-sm text-slate-500">Không có việc nào cần xử lý.</p>
      ) : (
        <div className="task-list">
          {needsGrading.map((group) => (
            <div className="task cursor-pointer" key={`${group.classId}:${group.assignmentId}`} onClick={() => navigate(`/teacher/classes/${group.classId}/assignments/${group.assignmentId}/grade`)}>
              <div className="task-dot" />
              <div><b>{group.count} bài nộp chờ chấm: {group.assignmentTitle}</b><small>{group.className} · nộp sớm nhất {formatDateTime(group.oldestSubmittedAt)}</small></div>
              <Badge tone="orange">Chấm bài</Badge>
            </div>
          ))}
          {rejectedCourses.map((course) => (
            <div className="task cursor-pointer" key={course.id} onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`)}>
              <div className="task-dot" />
              <div><b>Khóa bị từ chối: {course.title}</b><small>{course.rejectionReason || 'Không có lý do'}</small></div>
              <Badge tone="red">Sửa lại</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
    <Card>
      <SectionTitle title="Lớp học" action={<Button variant="ghost" onClick={() => navigate('/teacher/classes')}>Tất cả lớp học</Button>} />
      {classes.items.length === 0 ? (
        <p className="text-sm text-slate-500">Bạn chưa phụ trách lớp học nào.</p>
      ) : <>
        <Table
          headers={['Lớp', 'Học viên', 'Tiến độ TB', 'Điểm TB', 'Trạng thái']}
          rows={classes.items.map((cls) => {
            const [label, tone] = CLASS_STATUS[cls.status] || [cls.status, 'gray'];
            return [
              <button type="button" className="text-left bg-transparent border-0 p-0 cursor-pointer" onClick={() => navigate(`/teacher/classes/${cls.id}`)}>
                <b>{cls.name}</b><br /><span className="text-xs text-slate-500">{cls.course.title}</span>
              </button>,
              cls.studentCount,
              cls.averageProgress === null ? '—' : `${cls.averageProgress}%`,
              formatScore(cls.averageFinalScore),
              <Badge tone={tone}>{label}</Badge>
            ];
          })}
        />
        {classes.total > classes.items.length && <p className="text-xs text-slate-500 mt-3">Hiển thị {classes.items.length}/{classes.total} lớp.</p>}
      </>}
    </Card>
  </>;
}
