import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, PlayCircle, RefreshCw, TrendingUp, Trophy } from 'lucide-react';
import { PortalHeader, Button, StatCard, Progress, Card, SectionTitle, Badge } from '../../components/portal/PortalUI';
import classService from '../../services/classService';
import assignmentService from '../../services/assignmentService';
import quizService, { formatDateTime, formatScore } from '../../services/quizService';
import gradebookService from '../../services/gradebookService';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../components/common/Toast';

const isTodoAssignment = (item) =>
  item.canSubmit && (!item.mySubmission || item.mySubmission.status === 'resubmission_requested');
const isTodoQuiz = (quiz) => quiz.isAvailable && !quiz.passed;
const dueTime = (task) => (task.due ? new Date(task.due).getTime() : Number.MAX_SAFE_INTEGER);

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const displayName = user?.fullName || 'Học viên';
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const classes = (await classService.myClasses()) || [];
      const details = await Promise.all(classes.map(async (cls) => {
        const [assignments, quizzes, grades] = await Promise.all([
          assignmentService.classAssignments(cls.id).then(data => data.items || []).catch(() => []),
          quizService.classQuizzes(cls.id).catch(() => []),
          gradebookService.myGrades(cls.id).catch(() => null)
        ]);
        return { cls, assignments, quizzes, grades };
      }));
      setGroups(details);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải tổng quan học tập.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const show = (value) => (loading ? '…' : value);

  const avgProgress = groups.length
    ? Math.round(groups.reduce((sum, g) => sum + (g.cls.progress?.progressPercentage || 0), 0) / groups.length)
    : 0;

  const scores = groups.map(g => g.grades?.me?.finalScore).filter(value => typeof value === 'number');
  const avgScore = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;

  const tasks = [];
  groups.forEach(({ cls, assignments, quizzes }) => {
    assignments.filter(isTodoAssignment).forEach(item => tasks.push({
      key: `a-${cls.id}-${item.id}`,
      title: item.title,
      kind: 'Bài tập',
      className: cls.name,
      due: item.deadline,
      to: `/student/classes/${cls.id}/assignments/${item.id}`
    }));
    quizzes.filter(isTodoQuiz).forEach(quiz => tasks.push({
      key: `q-${cls.id}-${quiz.id}`,
      title: quiz.title,
      kind: 'Bài kiểm tra',
      className: cls.name,
      due: quiz.closeTime,
      to: `/student/quizzes/${quiz.id}/take?classId=${cls.id}`
    }));
  });
  tasks.sort((a, b) => dueTime(a) - dueTime(b));

  return (
    <>
      <PortalHeader
        eyebrow="STUDENT PORTAL"
        title={`Chào mừng trở lại, ${displayName} 👋`}
        desc="Tiếp tục lộ trình học tập và theo dõi tiến độ của bạn."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              <RefreshCw size={16} /> Làm mới
            </Button>
            <Button onClick={() => navigate('/student/my-courses')}>
              <PlayCircle size={17} /> Tiếp tục học
            </Button>
          </>
        }
      />

      <div className="stats-grid">
        <StatCard icon={BookOpen} label="Lớp đang học" value={show(groups.length)} />
        <StatCard icon={TrendingUp} label="Tiến độ trung bình" value={show(`${avgProgress}%`)} />
        <StatCard icon={Trophy} label="Điểm trung bình" value={show(avgScore === null ? '—' : formatScore(avgScore))} sub="Thang điểm 10" />
        <StatCard icon={CalendarDays} label="Việc cần làm" value={show(tasks.length)} sub="Bài tập & bài kiểm tra" />
      </div>

      <div className="dashboard-grid">
        <Card>
          <SectionTitle
            title="Tiến độ học tập"
            action={<Button variant="ghost" onClick={() => navigate('/student/my-courses')}>Xem chi tiết</Button>}
          />
          {loading ? (
            <div className="p-6 text-center text-slate-500">Đang tải...</div>
          ) : groups.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              Bạn chưa tham gia lớp học nào. Vào "Khóa học của tôi" để nhập mã lớp.
            </div>
          ) : (
            groups.map(({ cls }) => {
              const percent = cls.progress?.progressPercentage || 0;
              return (
                <div className="progress-row" key={cls.id}>
                  <div><b>{cls.course?.title || cls.name}</b><span>{percent}%</span></div>
                  <Progress value={percent} />
                </div>
              );
            })
          )}
        </Card>

        <Card>
          <SectionTitle title="Việc cần làm" />
          {loading ? (
            <div className="p-6 text-center text-slate-500">Đang tải...</div>
          ) : tasks.length === 0 ? (
            <div className="p-6 text-center text-slate-500">Bạn không có bài tập hay bài kiểm tra nào đang chờ.</div>
          ) : (
            tasks.slice(0, 5).map(task => (
              <div className="task cursor-pointer" key={task.key} onClick={() => navigate(task.to)}>
                <div className="task-dot" />
                <div>
                  <b>{task.title}</b>
                  <small>
                    {task.kind} · {task.className} · {task.due ? `hạn ${formatDateTime(task.due)}` : 'không giới hạn thời gian'}
                  </small>
                </div>
                <span>›</span>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Lớp học của tôi"
          action={<Button variant="ghost" onClick={() => navigate('/student/my-courses')}>Tất cả lớp học</Button>}
        />
        {loading ? (
          <div className="p-6 text-center text-slate-500">Đang tải...</div>
        ) : groups.length === 0 ? (
          <div className="p-6 text-center text-slate-500">Chưa có lớp học nào.</div>
        ) : (
          <div className="course-grid">
            {groups.slice(0, 6).map(({ cls }, index) => {
              const progress = cls.progress || {};
              return (
                <div className="course-mini cursor-pointer" key={cls.id} onClick={() => navigate(`/student/classes/${cls.id}`)}>
                  <div className={`course-cover c${index % 3}`}>EDU</div>
                  <div>
                    <Badge tone="green">Đang học</Badge>
                    <h3>{cls.course?.title || cls.name}</h3>
                    <Progress value={progress.progressPercentage || 0} />
                    <small>{progress.completedLessons || 0}/{progress.totalLessons || 0} bài học · {cls.name}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}