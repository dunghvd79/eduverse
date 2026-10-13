import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardCheck, FileWarning } from 'lucide-react';
import { Button, LoadError } from '../../components/portal/PortalUI';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../components/common/Toast';
import dashboardService from '../../services/dashboardService';
import { CLASS_STATUS } from '../../services/classService';
import { formatScore, formatDateTime } from '../../services/quizService';

// Xếp loại theo docs/requirements/grading-policy.md, thứ tự từ cao xuống thấp
const RANKINGS = [
  { key: 'Giỏi', color: 'bg-teal-700' },
  { key: 'Khá', color: 'bg-[#1168bd]' },
  { key: 'Trung bình', color: 'bg-amber-500' },
  { key: 'Chưa đạt', color: 'bg-rose-500' }
];

const COURSE_STATES = [
  { key: 'published', label: 'Đã xuất bản', color: 'bg-teal-700' },
  { key: 'pending', label: 'Chờ duyệt', color: 'bg-amber-500' },
  { key: 'draft', label: 'Nháp', color: 'bg-slate-300' },
  { key: 'rejected', label: 'Bị từ chối', color: 'bg-rose-500' }
];

const STATUS_DOT = { green: 'bg-teal-600', orange: 'bg-amber-500', gray: 'bg-slate-400' };
const ROW_FOCUS = 'focus-visible:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1168bd]';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const daysUntil = (dateOnly) => {
  if (!dateOnly) return null;
  const end = new Date(`${dateOnly}T23:59:59`);
  return Math.ceil((end - new Date()) / (24 * 60 * 60 * 1000));
};

const endDateLabel = (cls) => {
  if (cls.status !== 'active') return null;
  const days = daysUntil(cls.endDate);
  if (days === null) return null;
  if (days < 0) return 'Đã qua ngày kết thúc';
  if (days === 0) return 'Kết thúc hôm nay';
  return `Còn ${days} ngày`;
};

const Num = ({ children }) => <strong className="whitespace-nowrap font-semibold text-slate-900 tabular-nums">{children}</strong>;

/** Câu tóm tắt đầu trang: giảng viên đọc là biết hôm nay cần làm gì */
function Summary({ stats, needsGrading, rejectedCourses }) {
  const gradingClasses = new Set(needsGrading.map((g) => g.classId)).size;
  return (
    <p className="m-0 max-w-3xl text-xl leading-relaxed text-slate-600 md:text-2xl md:leading-relaxed">
      {stats.submissionsNeedGrading > 0
        ? <>Bạn có <Num>{stats.submissionsNeedGrading} bài nộp</Num> đang chờ chấm ở <Num>{gradingClasses} lớp</Num>. </>
        : <>Không có bài nộp nào đang chờ chấm. </>}
      {stats.activeClasses > 0
        ? <><Num>{stats.activeStudents} học viên</Num> đang học trong <Num>{stats.activeClasses} lớp</Num> bạn phụ trách.</>
        : <>Bạn chưa phụ trách lớp nào đang hoạt động.</>}
      {rejectedCourses.length > 0 && <> <Num>{rejectedCourses.length} khóa học</Num> bị từ chối cần sửa lại.</>}
    </p>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <h2 className="m-0 text-base font-semibold text-slate-900">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[#1168bd]" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

/** Thanh phân bố xếp loại: mỗi đoạn tỷ lệ với số học viên */
function DistributionBar({ distribution, total }) {
  if (!distribution || !total) return <span className="text-xs text-slate-500">Chưa có học viên</span>;
  const summary = RANKINGS.map((r) => `${r.key}: ${distribution[r.key] || 0}`).join(', ');
  return (
    <div title={summary} aria-label={`Phân bố xếp loại: ${summary}`}>
      <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {RANKINGS.map((r) => (distribution[r.key] ? (
          <div key={r.key} className={r.color} style={{ width: `${(distribution[r.key] / total) * 100}%` }} />
        ) : null))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        {RANKINGS.filter((r) => distribution[r.key]).map((r) => (
          <span key={r.key} className="inline-flex items-center gap-1.5">
            <i className={`h-2 w-2 rounded-full ${r.color}`} />{r.key} <span className="tabular-nums text-slate-700">{distribution[r.key]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ClassRow({ cls }) {
  const [statusLabel, statusTone] = CLASS_STATUS[cls.status] || [cls.status, 'gray'];
  const endLabel = endDateLabel(cls);
  return (
    <li className="border-b border-slate-100 last:border-b-0">
      <Link
        to={`/teacher/classes/${cls.id}`}
        className={`group grid gap-x-8 gap-y-4 px-5 py-5 no-underline transition-colors hover:bg-slate-50 md:grid-cols-2 ${ROW_FOCUS}`}
      >
        <div className="min-w-0 md:col-span-2">
          <p className="m-0 truncate font-semibold text-slate-900 group-hover:text-[#1168bd]">{cls.name}</p>
          <p className="m-0 mt-1 truncate text-sm text-slate-500">{cls.course.title}</p>
          <p className="m-0 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><i className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[statusTone]}`} />{statusLabel}</span>
            {cls.classCode && <span>Mã lớp <span className="font-medium text-slate-700">{cls.classCode}</span></span>}
            {endLabel && <span>{endLabel}</span>}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-slate-500">Tiến độ trung bình</span>
            <span className="font-semibold tabular-nums text-slate-900">{cls.averageProgress === null ? '—' : `${cls.averageProgress}%`}</span>
          </div>
          <ProgressBar value={cls.averageProgress || 0} />
          <p className="m-0 mt-2 text-xs text-slate-500"><span className="tabular-nums text-slate-700">{cls.studentCount}</span> học viên</p>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-slate-500">Điểm trung bình</span>
            <span className="font-semibold tabular-nums text-slate-900">{formatScore(cls.averageFinalScore)}</span>
          </div>
          <DistributionBar distribution={cls.distribution} total={cls.studentCount} />
        </div>
      </Link>
    </li>
  );
}

function TaskItem({ to, icon: Icon, tone, title, detail, action }) {
  return (
    <li className="border-b border-slate-100 last:border-b-0">
      <Link to={to} className={`group flex items-start gap-3 px-5 py-4 no-underline hover:bg-slate-50 ${ROW_FOCUS}`}>
        <span className={`mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg ${tone}`}><Icon size={16} aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">{title}</span>
          <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
        </span>
        <span className="flex-none self-center text-xs font-semibold text-[#1168bd] group-hover:underline">{action}</span>
      </Link>
    </li>
  );
}

function CourseBreakdown({ courses }) {
  return (
    <div className="px-5 py-5">
      <p className="m-0 flex items-baseline gap-2 text-sm text-slate-500">
        <span className="text-3xl font-semibold tabular-nums text-slate-900">{courses.total}</span>khóa học bạn tạo
      </p>
      {courses.total > 0 && (
        <div className="mt-4 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
          {COURSE_STATES.map((s) => (courses[s.key] ? (
            <div key={s.key} className={s.color} style={{ width: `${(courses[s.key] / courses.total) * 100}%` }} />
          ) : null))}
        </div>
      )}
      <dl className="m-0 mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {COURSE_STATES.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-2">
            <dt className="inline-flex items-center gap-2 text-slate-500"><i className={`h-2 w-2 rounded-full ${s.color}`} />{s.label}</dt>
            <dd className="m-0 font-semibold tabular-nums text-slate-900">{courses[s.key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
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
    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="m-0 mb-3 text-[28px] font-bold leading-tight tracking-tight text-slate-900">{greeting()}, {user?.fullName || 'giảng viên'}</h1>
        {data && <Summary stats={data.stats} needsGrading={data.needsGrading} rejectedCourses={data.rejectedCourses} />}
      </div>
      <div className="flex-none">
        <Button onClick={() => navigate('/teacher/courses')}><BookOpen size={16} /> Quản lý khóa học</Button>
      </div>
    </div>
  );

  if (error && !data) return <>{header}<LoadError message={error} onRetry={load} /></>;
  if (!data) return <>{header}<div className="p-10 text-center text-slate-500">Đang tải tổng quan...</div></>;

  const { stats, needsGrading, rejectedCourses, classes } = data;
  const hasTasks = needsGrading.length > 0 || rejectedCourses.length > 0;

  return <>
    {header}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel
        title={`Lớp đang dạy (${stats.activeClasses}/${stats.totalClasses})`}
        action={<Link to="/teacher/classes" className="text-sm font-semibold text-[#1168bd] no-underline hover:underline">Tất cả lớp học</Link>}
      >
        {classes.items.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="m-0 font-semibold text-slate-900">Bạn chưa phụ trách lớp học nào</p>
            <p className="m-0 mt-1 text-sm text-slate-500">Mở lớp cho một khóa học đã xuất bản để bắt đầu giảng dạy.</p>
            <div className="mt-4"><Button onClick={() => navigate('/teacher/classes')}>Mở lớp học</Button></div>
          </div>
        ) : <>
          <ul className="m-0 list-none p-0">{classes.items.map((cls) => <ClassRow key={cls.id} cls={cls} />)}</ul>
          {classes.total > classes.items.length && (
            <p className="m-0 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Đang hiển thị {classes.items.length} trên {classes.total} lớp.</p>
          )}
        </>}
      </Panel>

      <div className="grid gap-5">
        <Panel title="Cần xử lý">
          {hasTasks ? (
            <ul className="m-0 list-none p-0">
              {needsGrading.map((group) => (
                <TaskItem
                  key={`${group.classId}:${group.assignmentId}`}
                  to={`/teacher/classes/${group.classId}/assignments/${group.assignmentId}/grade`}
                  icon={ClipboardCheck}
                  tone="bg-amber-50 text-amber-700"
                  title={`${group.count} bài nộp: ${group.assignmentTitle}`}
                  detail={`${group.className}, bài sớm nhất nộp lúc ${formatDateTime(group.oldestSubmittedAt)}`}
                  action="Chấm bài"
                />
              ))}
              {rejectedCourses.map((course) => (
                <TaskItem
                  key={course.id}
                  to={`/teacher/courses/${course.id}/curriculum`}
                  icon={FileWarning}
                  tone="bg-rose-50 text-rose-600"
                  title={`Bị từ chối: ${course.title}`}
                  detail={course.rejectionReason || 'Quản lý đào tạo không ghi lý do.'}
                  action="Sửa lại"
                />
              ))}
            </ul>
          ) : (
            <div className="px-5 py-6">
              <p className="m-0 text-sm font-semibold text-slate-900">Đã xử lý xong</p>
              <p className="m-0 mt-1 text-sm text-slate-500">Bài nộp mới và khóa học bị từ chối sẽ hiện ở đây.</p>
            </div>
          )}
        </Panel>

        <Panel title="Khóa học của tôi">
          <CourseBreakdown courses={stats.courses} />
        </Panel>
      </div>
    </div>
  </>;
}
