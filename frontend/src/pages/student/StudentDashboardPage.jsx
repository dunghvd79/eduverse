import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Trophy, CalendarDays, ClipboardCheck, PlayCircle } from 'lucide-react';
import { PortalHeader, Button, StatCard, Progress, Card, SectionTitle, Badge, LoadError } from '../../components/portal/PortalUI';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../components/common/Toast';
import dashboardService from '../../services/dashboardService';
import { formatScore, formatDateTime } from '../../services/quizService';

const COVER_TONES = ['', 'c1', 'c2'];

const todoLink = (item) => (item.type === 'quiz'
  ? `/student/quizzes/${item.id}/take?classId=${item.classId}`
  : `/student/classes/${item.classId}/assignments/${item.id}`);

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const displayName = user?.fullName || 'Học viên';
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await dashboardService.student());
    } catch (err) {
      const message = err?.message || 'Không thể tải tổng quan học tập.';
      setError(message);
      toast.error(message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const continueLearning = data?.continueLearning;
  const header = (
    <PortalHeader
      title={`Chào mừng trở lại, ${displayName} 👋`}
      desc="Tiếp tục lộ trình học tập và theo dõi tiến độ của bạn."
      actions={(
        <Button disabled={!continueLearning} onClick={() => navigate(`/student/classes/${continueLearning.classId}`)}>
          <PlayCircle size={17} /> Tiếp tục học
        </Button>
      )}
    />
  );

  if (error && !data) {
    return <>{header}<LoadError message={error} onRetry={load} /></>;
  }
  if (!data) return <>{header}<div className="p-10 text-center text-slate-500">Đang tải tổng quan...</div></>;

  const { stats, classes, todo } = data;
  return <>
    {header}
    <div className="stats-grid">
      <StatCard icon={BookOpen} label="Lớp đang học" value={stats.activeClasses} />
      <StatCard icon={Trophy} label="Điểm trung bình" value={formatScore(stats.averageFinalScore)} sub="Thang điểm 10" />
      <StatCard icon={CalendarDays} label="Sắp đến hạn" value={stats.dueSoonCount} sub="Trong 7 ngày" />
      <StatCard icon={ClipboardCheck} label="Bài kiểm tra đã đạt" value={stats.quizzesPassed} />
    </div>

    {classes.length === 0 ? (
      <Card>
        <div className="p-8 text-center text-slate-500">
          <BookOpen className="mx-auto mb-3" size={32} />
          <p className="mb-4">Bạn chưa tham gia lớp học nào.</p>
          <Button onClick={() => navigate('/student/my-courses')}>Tham gia lớp bằng mã</Button>
        </div>
      </Card>
    ) : <>
      <div className="dashboard-grid">
        <Card>
          <SectionTitle title="Tiến độ học tập" action={<Button variant="ghost" onClick={() => navigate('/student/grades')}>Xem điểm số</Button>} />
          {classes.map((cls) => (
            <div className="progress-row" key={cls.id}>
              <div><b>{cls.course.title}</b><span>{cls.progress.progressPercentage}%</span></div>
              <Progress value={cls.progress.progressPercentage} />
            </div>
          ))}
        </Card>
        <Card>
          <SectionTitle title="Việc cần làm" />
          {todo.items.length === 0 ? (
            <p className="text-sm text-slate-500">Bạn đã hoàn thành mọi việc cần làm. 🎉</p>
          ) : (
            <div className="task-list">
              {todo.items.map((item) => (
                <div className="task cursor-pointer" key={`${item.type}:${item.classId}:${item.id}`} onClick={() => navigate(todoLink(item))}>
                  <div className="task-dot" />
                  <div>
                    <b>{item.title}</b>
                    <small>{item.type === 'quiz' ? 'Bài kiểm tra' : 'Bài tập'} · {item.deadline ? `Hạn ${formatDateTime(item.deadline)}` : 'Không giới hạn thời gian'}</small>
                  </div>
                  {item.needsResubmission ? <Badge tone="orange">Nộp lại</Badge> : item.isOverdue ? <Badge tone="red">Quá hạn</Badge> : <span>›</span>}
                </div>
              ))}
              {todo.total > todo.items.length && <p className="text-xs text-slate-500 mt-3">Còn {todo.total - todo.items.length} việc khác.</p>}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Lớp học của tôi" action={<Button variant="ghost" onClick={() => navigate('/student/my-courses')}>Tất cả lớp học</Button>} />
        <div className="course-grid">
          {classes.map((cls, index) => (
            <div className="course-mini cursor-pointer" key={cls.id} onClick={() => navigate(`/student/classes/${cls.id}`)}>
              {cls.course.thumbnailUrl
                ? <img src={cls.course.thumbnailUrl} alt={cls.course.title} className="course-cover w-full object-cover" />
                : <div className={`course-cover ${COVER_TONES[index % COVER_TONES.length]}`}><BookOpen size={34} /></div>}
              <div>
                <Badge tone="green">Đang học</Badge>
                <h3>{cls.course.title}</h3>
                <Progress value={cls.progress.progressPercentage} />
                <small>{cls.progress.completedLessons}/{cls.progress.totalLessons} bài học · Điểm {formatScore(cls.finalScore)}</small>
                <small>{cls.name}</small>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>}
  </>;
}
