import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardCheck,
  FileWarning,
  Users,
  GraduationCap,
  Sparkles,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  ArrowRight,
  Layers
} from 'lucide-react';
import { Button, LoadError } from '../../components/portal/PortalUI';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../components/common/Toast';
import dashboardService from '../../services/dashboardService';
import { CLASS_STATUS } from '../../services/classService';
import { formatScore, formatDateTime, formatPercent } from '../../services/quizService';

// Xếp loại theo docs/requirements/grading-policy.md, thứ tự từ cao xuống thấp
const RANKINGS = [
  { key: 'Giỏi', color: 'bg-teal-600' },
  { key: 'Khá', color: 'bg-[#1168bd]' },
  { key: 'Trung bình', color: 'bg-amber-500' },
  { key: 'Chưa đạt', color: 'bg-rose-500' }
];

const COURSE_STATES = [
  { key: 'published', label: 'Đã xuất bản', color: 'bg-teal-600', dot: 'bg-teal-500' },
  { key: 'pending', label: 'Chờ duyệt', color: 'bg-amber-500', dot: 'bg-amber-500' },
  { key: 'draft', label: 'Nháp', color: 'bg-slate-300', dot: 'bg-slate-400' },
  { key: 'rejected', label: 'Bị từ chối', color: 'bg-rose-500', dot: 'bg-rose-500' }
];

const STATUS_DOT = {
  green: 'bg-emerald-500',
  orange: 'bg-amber-500',
  gray: 'bg-slate-400'
};

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

/** Panel bọc các khối nội dung */
function Panel({ title, action, badge, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <h2 className="m-0 text-base font-bold text-slate-900">{title}</h2>
          {badge}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Thanh tiến độ học tập */
function ProgressBar({ value }) {
  const clamped = Math.min(100, Math.max(0, value || 0));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#1168bd] to-[#38bdf8] transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Thanh phân bố xếp loại học viên */
function DistributionBar({ distribution, total }) {
  if (!distribution || !total) {
    return <span className="text-xs text-slate-400">Chưa có dữ liệu xếp loại</span>;
  }
  const summary = RANKINGS.map((r) => `${r.key}: ${distribution[r.key] || 0}`).join(', ');
  return (
    <div title={summary} aria-label={`Phân bố xếp loại: ${summary}`}>
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {RANKINGS.map((r) =>
          distribution[r.key] ? (
            <div
              key={r.key}
              className={`${r.color} transition-all`}
              style={{ width: `${(distribution[r.key] / total) * 100}%` }}
            />
          ) : null
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        {RANKINGS.filter((r) => distribution[r.key]).map((r) => (
          <span key={r.key} className="inline-flex items-center gap-1.5">
            <i className={`h-2 w-2 rounded-full ${r.color}`} />
            <span className="text-slate-600">{r.key}</span>
            <strong className="font-semibold tabular-nums text-slate-900">{distribution[r.key]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Thẻ KPI chỉ số thống kê trên cùng - Chuẩn Enterprise Design */
function KpiCard({
  icon: Icon,
  title,
  value,
  unit,
  subtitle,
  badgeText,
  badgeTone = 'blue',
  footerIcon: FooterIcon,
  footerText
}) {
  const tones = {
    blue: {
      accentBar: 'bg-[#1168bd]',
      iconWrap: 'bg-blue-50 text-[#1168bd] ring-1 ring-blue-500/20',
      badge: 'bg-blue-50 text-[#1168bd] ring-1 ring-blue-500/20',
      dot: 'bg-[#1168bd]'
    },
    emerald: {
      accentBar: 'bg-emerald-500',
      iconWrap: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20',
      badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20',
      dot: 'bg-emerald-500'
    },
    amber: {
      accentBar: 'bg-amber-500',
      iconWrap: 'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20',
      badge: 'bg-amber-50 text-amber-800 ring-1 ring-amber-500/20',
      dot: 'bg-amber-500'
    },
    purple: {
      accentBar: 'bg-purple-600',
      iconWrap: 'bg-purple-50 text-purple-600 ring-1 ring-purple-500/20',
      badge: 'bg-purple-50 text-purple-700 ring-1 ring-purple-500/20',
      dot: 'bg-purple-500'
    }
  };

  const theme = tones[badgeTone] || tones.blue;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* Vạch màu định danh tinh tế ở đỉnh thẻ */}
      <div className={`absolute top-0 inset-x-0 h-1 ${theme.accentBar}`} />

      {/* Hàng 1: Icon + Tiêu đề chỉ số & Badge trạng thái */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`grid h-9 w-9 flex-none place-items-center rounded-xl ${theme.iconWrap}`}>
            <Icon size={18} />
          </div>
          <span className="truncate text-sm font-semibold text-slate-700">{title}</span>
        </div>
        {badgeText && (
          <span className={`inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${theme.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot} ${badgeTone === 'amber' ? 'animate-pulse' : ''}`} />
            {badgeText}
          </span>
        )}
      </div>

      {/* Hàng 2: Con số thống kê nổi bật + Đơn vị */}
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      {/* Hàng 3: Chú thích ngữ cảnh phía dưới */}
      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {FooterIcon ? (
          <FooterIcon size={13} className="text-slate-400 flex-none" />
        ) : (
          <span className="h-1 w-1 rounded-full bg-slate-400 flex-none" />
        )}
        <span className="truncate font-medium">{footerText || subtitle}</span>
      </div>
    </div>
  );
}

/** Thẻ lớp học hiện đại (Modern Class Card) */
function ClassCard({ cls }) {
  const [statusLabel, statusTone] = CLASS_STATUS[cls.status] || [cls.status, 'gray'];
  const endLabel = endDateLabel(cls);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#1168bd]/40 hover:shadow-sm">
      {/* Header của thẻ lớp */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            to={`/teacher/classes/${cls.id}`}
            className="group inline-flex items-center gap-1.5 text-base font-bold text-slate-900 no-underline hover:text-[#1168bd]"
          >
            <span className="truncate">{cls.name}</span>
            <ChevronRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1168bd]" />
          </Link>
          <p className="m-0 mt-1 truncate text-sm text-slate-500">{cls.course.title}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            <i className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[statusTone] || 'bg-slate-400'}`} />
            {statusLabel}
          </span>
          {cls.classCode && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1168bd]">
              Mã: {cls.classCode}
            </span>
          )}
          {endLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600 border border-slate-200/60">
              <Clock size={12} className="text-slate-400" />
              {endLabel}
            </span>
          )}
        </div>
      </div>

      {/* Grid chỉ số: Tiến độ & Phổ điểm */}
      <div className="mt-5 grid gap-5 rounded-xl bg-slate-50/60 p-4 sm:grid-cols-2 border border-slate-100">
        <div>
          <div className="mb-2 flex items-baseline justify-between text-xs font-semibold">
            <span className="text-slate-600">Tiến độ trung bình</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatPercent(cls.averageProgress)}
            </span>
          </div>
          <ProgressBar value={cls.averageProgress || 0} />
          <p className="m-0 mt-2 text-xs text-slate-500">
            <strong className="font-semibold text-slate-800 tabular-nums">{cls.studentCount}</strong> học viên trong lớp
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between text-xs font-semibold">
            <span className="text-slate-600">Điểm trung bình</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatScore(cls.averageFinalScore)}
            </span>
          </div>
          <DistributionBar distribution={cls.distribution} total={cls.studentCount} />
        </div>
      </div>

      {/* Hàng phím tắt truy cập nhanh */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            to={`/teacher/classes/${cls.id}?tab=gradebook`}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            <BarChart3 size={13} className="text-slate-500" /> Sổ điểm
          </Link>
          <Link
            to={`/teacher/classes/${cls.id}?tab=assignments`}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            <FileText size={13} className="text-slate-500" /> Bài tập
          </Link>
          <Link
            to={`/teacher/classes/${cls.id}?tab=members`}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            <Users size={13} className="text-slate-500" /> Học viên
          </Link>
        </div>

        <Link
          to={`/teacher/classes/${cls.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#1168bd] no-underline hover:underline"
        >
          Vào lớp học <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

/** Tác vụ cần xử lý */
function TaskItem({ to, icon: Icon, tone, title, detail, action }) {
  return (
    <li className="border-b border-slate-100 last:border-b-0">
      <Link
        to={to}
        className="group flex items-start gap-3.5 px-5 py-4 no-underline transition-colors hover:bg-slate-50"
      >
        <span className={`mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl ${tone}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900 group-hover:text-[#1168bd] transition-colors">
            {title}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-slate-500">{detail}</span>
        </span>
        <span className="inline-flex flex-none items-center gap-1 self-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#1168bd] group-hover:bg-[#1168bd] group-hover:text-white transition-colors">
          {action}
        </span>
      </Link>
    </li>
  );
}

/** Widget Phân tích Khóa học của tôi */
function CourseBreakdown({ courses }) {
  return (
    <div className="p-5">
      <div className="flex items-baseline justify-between">
        <p className="m-0 text-sm text-slate-500">
          Tổng số khóa bạn đã tạo
        </p>
        <span className="text-2xl font-black tabular-nums text-slate-900">{courses.total}</span>
      </div>

      {courses.total > 0 && (
        <div className="mt-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
          {COURSE_STATES.map((s) =>
            courses[s.key] ? (
              <div
                key={s.key}
                className={s.color}
                style={{ width: `${(courses[s.key] / courses.total) * 100}%` }}
              />
            ) : null
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {COURSE_STATES.map((s) => (
          <div key={s.key} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <i className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <span className="font-bold tabular-nums text-slate-900">{courses[s.key] || 0}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <Link
          to="/teacher/courses"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-700 no-underline transition-colors hover:bg-slate-50 hover:text-[#1168bd]"
        >
          <BookOpen size={14} /> Quản lý danh sách khóa học
        </Link>
      </div>
    </div>
  );
}

/** Widget Tiện ích Giảng dạy EduVerse */
function TeachingToolkit() {
  const tools = [
    {
      title: 'Tạo đề thi bằng AI',
      desc: 'Sinh trắc nghiệm & ma trận câu hỏi tự động với Gemini AI',
      to: '/teacher/quizzes/ai-generator',
      icon: Sparkles,
      iconBg: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Ngân hàng bài kiểm tra',
      desc: 'Kho đề trắc nghiệm, cấu hình thời gian và điểm số',
      to: '/teacher/quizzes',
      icon: ClipboardCheck,
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Quản lý bài tập',
      desc: 'Bài tập tự luận theo lớp, theo dõi hạn nộp và chấm điểm',
      to: '/teacher/assignments',
      icon: FileText,
      iconBg: 'bg-emerald-50 text-emerald-600'
    }
  ];

  return (
    <div className="divide-y divide-slate-100">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Link
            key={tool.title}
            to={tool.to}
            className="group flex items-start gap-3.5 p-4 no-underline transition-colors hover:bg-slate-50"
          >
            <div className={`mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl ${tool.iconBg}`}>
              <Icon size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-semibold text-slate-900 group-hover:text-[#1168bd] transition-colors">
                <span>{tool.title}</span>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="m-0 mt-0.5 text-xs leading-relaxed text-slate-500">{tool.desc}</p>
            </div>
          </Link>
        );
      })}
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

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) {
    return (
      <div className="py-6">
        <LoadError message={error} onRetry={load} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#1168bd]" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Đang tải bảng tổng quan giảng dạy...</p>
      </div>
    );
  }

  const { stats, needsGrading, rejectedCourses, classes } = data;
  const hasTasks = needsGrading.length > 0 || rejectedCourses.length > 0;
  const totalTasks = needsGrading.reduce((sum, g) => sum + g.count, 0) + rejectedCourses.length;

  return (
    <div className="space-y-7 pb-12">
      {/* 1. Header chào mừng và các nút tác vụ nhanh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            {greeting()}, {user?.fullName || 'Giảng viên'}
          </h1>
          <p className="m-0 mt-1 text-sm text-slate-500">
            {stats.submissionsNeedGrading > 0 ? (
              <>
                Bạn có <strong className="font-semibold text-amber-600">{stats.submissionsNeedGrading} bài nộp</strong> đang chờ chấm điểm. Hãy hoàn tất để kịp tiến độ cho học viên.
              </>
            ) : (
              <>
                Tất cả bài tập đã được chấm xong. Chúc bạn có một ngày làm việc và giảng dạy hiệu quả!
              </>
            )}
          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            onClick={() => navigate('/teacher/quizzes/ai-generator')}
            className="!inline-flex !items-center !gap-2 !bg-gradient-to-r !from-purple-600 !to-[#1168bd] !text-white !h-[39px] !px-4 hover:opacity-95 shadow-xs whitespace-nowrap"
          >
            <Sparkles size={16} className="flex-none" />
            <span>Tạo đề bằng AI</span>
          </Button>
          <Button variant="secondary" onClick={() => navigate('/teacher/classes')}>
            <Plus size={16} /> Mở lớp mới
          </Button>
          <Button variant="secondary" onClick={() => navigate('/teacher/courses')}>
            <BookOpen size={16} /> Khóa học
          </Button>
        </div>
      </div>

      {/* 2. Hàng 4 thẻ KPI chỉ số quan trọng - Chuẩn Enterprise UI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          title="Học viên đang học"
          value={stats.activeStudents}
          unit="học viên"
          badgeText="Hoạt động"
          badgeTone="blue"
          footerIcon={GraduationCap}
          footerText={`Ghi danh trong ${stats.activeClasses} lớp đang mở`}
        />
        <KpiCard
          icon={GraduationCap}
          title="Lớp đang phụ trách"
          value={`${stats.activeClasses}/${stats.totalClasses}`}
          unit="lớp"
          badgeText="Đang mở lớp"
          badgeTone="emerald"
          footerIcon={Clock}
          footerText={`${stats.activeClasses} lớp đang trong kỳ giảng dạy`}
        />
        <KpiCard
          icon={ClipboardCheck}
          title="Bài nộp chờ chấm"
          value={stats.submissionsNeedGrading}
          unit="bài nộp"
          badgeText={stats.submissionsNeedGrading > 0 ? "Cần xử lý" : "Hoàn tất"}
          badgeTone={stats.submissionsNeedGrading > 0 ? "amber" : "emerald"}
          footerIcon={stats.submissionsNeedGrading > 0 ? Clock : CheckCircle2}
          footerText={
            stats.submissionsNeedGrading > 0
              ? "Cần chấm điểm cho học viên"
              : "Tất cả bài tập đã được chấm xong"
          }
        />
        <KpiCard
          icon={Layers}
          title="Khóa học đã tạo"
          value={stats.courses?.total || 0}
          unit="khóa học"
          badgeText="Học liệu"
          badgeTone="purple"
          footerIcon={FileText}
          footerText={`${stats.courses?.published || 0} đã duyệt · ${stats.courses?.draft || 0} bản nháp`}
        />
      </div>

      {/* 3. Bố cục 2 cột chính: Lớp học bên trái & Việc cần làm + Tiện ích bên phải */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* CỘT TRÁI: Danh sách các lớp đang phụ trách */}
        <div className="space-y-6">
          <Panel
            title={`Lớp đang phụ trách (${stats.activeClasses}/${stats.totalClasses})`}
            action={
              <Link
                to="/teacher/classes"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#1168bd] no-underline hover:underline"
              >
                Tất cả lớp học <ChevronRight size={15} />
              </Link>
            }
          >
            {classes.items.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <GraduationCap size={24} />
                </div>
                <p className="m-0 text-base font-bold text-slate-900">Bạn chưa phụ trách lớp học nào</p>
                <p className="m-0 mt-1.5 text-sm text-slate-500">
                  Mở lớp cho một khóa học đã xuất bản để bắt đầu tuyển sinh và giảng dạy.
                </p>
                <div className="mt-5">
                  <Button onClick={() => navigate('/teacher/classes')}>
                    <Plus size={16} /> Mở lớp học ngay
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {classes.items.map((cls) => (
                  <ClassCard key={cls.id} cls={cls} />
                ))}
                {classes.total > classes.items.length && (
                  <p className="m-0 pt-2 text-center text-xs text-slate-500">
                    Đang hiển thị {classes.items.length} trên {classes.total} lớp.{' '}
                    <Link to="/teacher/classes" className="font-semibold text-[#1168bd] hover:underline">
                      Xem danh sách đầy đủ
                    </Link>
                  </p>
                )}
              </div>
            )}
          </Panel>
        </div>

        {/* CỘT PHẢI: Việc cần làm hôm nay & Phân tích khóa học & Tiện ích giảng dạy */}
        <div className="space-y-6">
          {/* Widget 1: Việc cần làm hôm nay (Action Center) */}
          <Panel
            title="Việc cần làm hôm nay"
            badge={
              hasTasks ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {totalTasks} việc
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  Hoàn tất
                </span>
              )
            }
          >
            {hasTasks ? (
              <ul className="m-0 list-none p-0 divide-y divide-slate-100">
                {needsGrading.map((group) => (
                  <TaskItem
                    key={`${group.classId}:${group.assignmentId}`}
                    to={`/teacher/classes/${group.classId}/assignments/${group.assignmentId}/grade`}
                    icon={ClipboardCheck}
                    tone="bg-amber-50 text-amber-600"
                    title={`${group.count} bài nộp: ${group.assignmentTitle}`}
                    detail={`${group.className} • Nộp sớm nhất lúc ${formatDateTime(group.oldestSubmittedAt)}`}
                    action="Chấm bài"
                  />
                ))}
                {rejectedCourses.map((course) => (
                  <TaskItem
                    key={course.id}
                    to={`/teacher/courses/${course.id}/curriculum`}
                    icon={FileWarning}
                    tone="bg-rose-50 text-rose-600"
                    title={`Khóa học bị từ chối: ${course.title}`}
                    detail={course.rejectionReason || 'Vui lòng kiểm tra lại nội dung bài học.'}
                    action="Sửa lại"
                  />
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center">
                <div className="mx-auto mb-2.5 grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={22} />
                </div>
                <p className="m-0 text-sm font-bold text-slate-900">Tất cả đã được xử lý xong!</p>
                <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">
                  Không có bài nộp nào đang chờ chấm và không có khóa học bị từ chối. Bạn đang làm rất tốt!
                </p>
              </div>
            )}
          </Panel>

          {/* Widget 2: Khóa học của tôi */}
          <Panel title="Khóa học của tôi">
            <CourseBreakdown courses={stats.courses} />
          </Panel>

          {/* Widget 3: Công cụ giảng dạy EduVerse */}
          <Panel title="Công cụ giảng dạy">
            <TeachingToolkit />
          </Panel>
        </div>
      </div>
    </div>
  );
}
