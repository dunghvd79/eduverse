import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, ClipboardCheck, FileQuestion, FileText, PlayCircle, Video } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PortalHeader, Button, Progress, Card, SectionTitle, Badge } from '../../components/portal/PortalUI';
import classService, { CLASS_STATUS, formatDate } from '../../services/classService';
import courseService from '../../services/courseService';
import quizService from '../../services/quizService';
import { StudentQuizTable } from './StudentQuizzesPage';
import assignmentService from '../../services/assignmentService';
import { StudentAssignmentTable } from './StudentAssignmentsPage';
import { toast } from '../../components/common/Toast';

const TYPE_ICON = { theory: FileText, video: Video, quiz: ClipboardCheck, assignment: FileQuestion };
const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();

export default function StudentClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [outline, setOutline] = useState(null);
  const [members, setMembers] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tab, setTab] = useState('lessons');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const detail = await classService.get(id);
        if (cancelled) return;
        setCls(detail);
        if (!detail.permissions?.isMember) return;

        const [curriculum, memberList, quizList, assignmentList] = await Promise.all([
          courseService.curriculum(detail.course.id, detail.id),
          classService.members(detail.id, { limit: 100 }),
          quizService.classQuizzes(detail.id).catch(() => []),
          assignmentService.classAssignments(detail.id).then(d => d.items || []).catch(() => [])
        ]);
        if (!cancelled) {
          setOutline(curriculum);
          setMembers(memberList);
          setQuizzes(quizList);
          setAssignments(assignmentList);
        }
      } catch (error) {
        if (!cancelled) toast.error(error?.message || 'Không thể tải lớp học.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const lessons = useMemo(() => (outline?.chapters || []).flatMap(chapter => chapter.lessons || []), [outline]);
  const nextLesson = lessons.find(lesson => !lesson.isCompleted) || lessons[0];
  const learnUrl = (lessonId) => `/student/courses/${cls.course.id}/learn/${lessonId}?classId=${cls.id}`;

  if (loading) return <div className="p-10 text-center text-slate-500">Đang tải lớp học...</div>;
  if (!cls) return null;

  if (!cls.permissions?.isMember) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="font-semibold text-slate-700">Bạn chưa là thành viên của lớp "{cls.name}".</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Hãy nhập mã lớp do giảng viên cung cấp ở trang Khóa học của tôi.</p>
          <Button onClick={() => navigate('/student/my-courses')}>Về Khóa học của tôi</Button>
        </div>
      </Card>
    );
  }

  const percent = outline?.progressPercentage ?? cls.progress?.progressPercentage ?? 0;
  const [statusLabel, statusTone] = CLASS_STATUS[cls.status] || [cls.status, 'gray'];
  const allDone = lessons.length > 0 && lessons.every(lesson => lesson.isCompleted);

  return (
    <>
      <PortalHeader
        eyebrow="CLASSROOM"
        title={cls.name}
        desc={`${cls.course.title} · Giảng viên: ${cls.teacher?.fullName || '—'} · ${cls.totalStudents} học viên · ${formatDate(cls.startDate)} – ${formatDate(cls.endDate)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/student/my-courses')}><ArrowLeft size={16} /> Khóa học của tôi</Button>
            {nextLesson && (
              <Button onClick={() => navigate(learnUrl(nextLesson.id))}>
                <PlayCircle size={16} /> {allDone ? 'Xem lại bài học' : percent > 0 ? 'Học tiếp' : 'Bắt đầu học'}
              </Button>
            )}
          </>
        }
      />

      <div className="dashboard-grid">
        <Card>
          <SectionTitle title="Tiến độ của bạn" action={cls.status !== 'active' ? <Badge tone={statusTone}>{statusLabel}</Badge> : null} />
          <div className="big-number">{percent}%</div>
          <Progress value={percent} />
          <div className="mini-stats">
            <span><b>{outline?.completedLessons ?? 0}</b><small>Bài hoàn thành</small></span>
            <span><b>{outline?.totalLessons ?? 0}</b><small>Tổng số bài</small></span>
            <span><b>{outline?.chapters?.length ?? 0}</b><small>Chương</small></span>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Bài tiếp theo" />
          {nextLesson ? (
            <div className="space-y-3">
              <p className="font-semibold">{nextLesson.title}</p>
              <p className="text-sm text-slate-500">
                {allDone ? 'Bạn đã hoàn thành toàn bộ bài học của lớp. 🎉' : 'Tiếp tục từ bài học đầu tiên bạn chưa hoàn thành.'}
              </p>
              <Button onClick={() => navigate(learnUrl(nextLesson.id))}><PlayCircle size={16} /> Vào học</Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Khóa học chưa có bài học nào.</p>
          )}
        </Card>
      </div>

      <div className="tabs-card flex-wrap">
        <button className={`tab ${tab === 'lessons' ? 'active' : ''}`} onClick={() => setTab('lessons')}>Bài học</button>
        <button className={`tab ${tab === 'quizzes' ? 'active' : ''}`} onClick={() => setTab('quizzes')}>Bài kiểm tra ({quizzes.length})</button>
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>Bài tập ({assignments.length})</button>
        <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Bạn học ({members?.meta?.totalItems ?? 0})</button>
      </div>

      {tab === 'quizzes' && <Card><StudentQuizTable classId={cls.id} quizzes={quizzes} /></Card>}
      {tab === 'assignments' && <Card><StudentAssignmentTable classId={cls.id} items={assignments} /></Card>}
      {tab === 'lessons' && (
        <Card>
          {(outline?.chapters || []).length === 0 && <p className="text-sm text-slate-500">Khóa học chưa có nội dung.</p>}
          {(outline?.chapters || []).map((chapter, chapterIndex) => (
            <div key={chapter.id} className="mb-5 last:mb-0">
              <h3 className="font-bold mb-2">Chương {chapterIndex + 1}. {chapter.title}</h3>
              <div className="space-y-1">
                {(chapter.lessons || []).map(lesson => {
                  const Icon = TYPE_ICON[lesson.lessonType] || FileText;
                  return (
                    <Link
                      key={lesson.id}
                      to={learnUrl(lesson.id)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 border border-transparent hover:border-slate-200"
                    >
                      {lesson.isCompleted
                        ? <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" aria-label="Đã hoàn thành" />
                        : <Circle size={18} className="text-slate-300 flex-shrink-0" aria-label="Chưa hoàn thành" />}
                      <Icon size={15} className="text-slate-400 flex-shrink-0" />
                      <span className="flex-1 min-w-0 truncate text-sm">{lesson.title}</span>
                    </Link>
                  );
                })}
                {(chapter.lessons || []).length === 0 && <p className="text-sm text-slate-400 px-3">Chương chưa có bài học.</p>}
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === 'members' && (
        <Card>
          {members?.items?.length ? (
            <div className="member-grid">
              {members.items.map(member => (
                <div className="member" key={member.studentId}>
                  <div className="avatar">{initials(member.fullName)}</div>
                  <div className="min-w-0">
                    <b className="block truncate">{member.fullName}</b>
                    <small>Tham gia {formatDate(member.enrolledAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Lớp chưa có thành viên khác.</p>
          )}
        </Card>
      )}
    </>
  );
}
