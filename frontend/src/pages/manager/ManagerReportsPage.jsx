import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Trophy, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { PortalHeader, Button, StatCard, Progress, Card, SectionTitle, Table, Badge, LoadError } from '../../components/portal/PortalUI';
import { toast } from '../../components/common/Toast';
import classService, { CLASS_STATUS } from '../../services/classService';
import gradebookService, { RANKING_TONE } from '../../services/gradebookService';

// Báo cáo tính ở frontend từ API có sẵn: GET /classes (toàn hệ thống) + GET /classes/:id/gradebook (từng lớp)
const MAX_CLASSES = 50; // chỉ tính trên các lớp mới nhất để trang không quá nặng
const CONCURRENCY = 4; // số bảng điểm tải song song
const RANKINGS = ['Giỏi', 'Khá', 'Trung bình', 'Chưa đạt'];
const STATUS_TABS = [['', 'Tất cả'], ['active', 'Đang hoạt động'], ['paused', 'Tạm dừng'], ['closed', 'Đã kết thúc']];

// --- helpers (hàm thuần, không dùng React) ---
const round2 = (v) => Math.round(v * 100) / 100;
const sum = (list) => list.reduce((total, v) => total + v, 0);
const fmt = (v, suffix = '') => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}${suffix}`);

const toReport = (cls, book) => {
  const rows = book.rows || [];
  const students = book.summary?.totalStudents ?? rows.length;
  return {
    cls,
    students,
    avgScore: book.summary?.averageFinalScore ?? null,
    avgProgress: rows.length ? round2(sum(rows.map((r) => r.progressPercentage || 0)) / rows.length) : null,
    completed: rows.filter((r) => r.totalLessons > 0 && r.completedLessons >= r.totalLessons).length,
    distribution: book.summary?.distribution || {},
    ungraded: book.summary?.ungradedCount || 0
  };
};

// Trung bình có trọng số theo số học viên; bỏ qua lớp chưa có số liệu
const weightedAverage = (reports, key) => {
  const valid = reports.filter((r) => r[key] !== null && r[key] !== undefined && r.students > 0);
  const total = sum(valid.map((r) => r.students));
  return total ? round2(sum(valid.map((r) => r[key] * r.students)) / total) : null;
};

const summarize = (reports) => {
  const students = sum(reports.map((r) => r.students));
  const completed = sum(reports.map((r) => r.completed));
  return {
    classes: reports.length,
    activeClasses: reports.filter((r) => r.cls.status === 'active').length,
    students,
    completed,
    completionRate: students ? round2((completed / students) * 100) : null,
    avgScore: weightedAverage(reports, 'avgScore'),
    avgProgress: weightedAverage(reports, 'avgProgress'),
    distribution: Object.fromEntries(RANKINGS.map((label) => [label, sum(reports.map((r) => r.distribution[label] || 0))]))
  };
};

const rankTeachers = (reports) => {
  const groups = {};
  reports.forEach((r) => {
    const key = r.cls.teacher?.id || 'none';
    (groups[key] = groups[key] || { name: r.cls.teacher?.fullName || 'Chưa phân công', items: [] }).items.push(r);
  });
  return Object.values(groups)
    .map((g) => ({ name: g.name, classes: g.items.length, students: sum(g.items.map((r) => r.students)), avgScore: weightedAverage(g.items, 'avgScore') }))
    .sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1) || b.students - a.students);
};

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const buildCsv = (reports) => {
  const header = ['Lớp học', 'Mã lớp', 'Khóa học', 'Giảng viên', 'Trạng thái', 'Số học viên', 'Tiến độ TB (%)', 'Điểm TB (thang 10)', 'Học viên học hết bài', ...RANKINGS, 'Bài chờ chấm'];
  const lines = reports.map((r) => [
    r.cls.name, r.cls.classCode, r.cls.course?.title, r.cls.teacher?.fullName, CLASS_STATUS[r.cls.status]?.[0] || r.cls.status,
    r.students, r.avgProgress, r.avgScore, r.completed, ...RANKINGS.map((label) => r.distribution[label] || 0), r.ungraded
  ]);
  return String.fromCharCode(0xFEFF) + [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\r\n');
};
// --- end helpers ---

async function loadReports() {
  const list = await classService.list({ page: 1, limit: MAX_CLASSES });
  const classes = list.items || [];
  const results = new Array(classes.length);
  let next = 0;
  const worker = async () => {
    while (next < classes.length) {
      const index = next++;
      try {
        results[index] = toReport(classes[index], await gradebookService.gradebook(classes[index].id));
      } catch {
        results[index] = { cls: classes[index], failed: true };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, classes.length) }, worker));
  return { reports: results, totalClasses: list.meta?.totalItems ?? classes.length, loadedAt: new Date() };
}

export default function ManagerReportsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loadReports();
      if (id === requestId.current) setData(result);
    } catch (err) {
      if (id !== requestId.current) return;
      const message = err?.message || 'Không thể tải báo cáo.';
      setError(message);
      toast.error(message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); return () => { requestId.current += 1; }; }, [load]);

  const visible = useMemo(
    () => (data ? data.reports.filter((r) => !status || r.cls.status === status) : []),
    [data, status]
  );
  const loaded = useMemo(() => visible.filter((r) => !r.failed), [visible]);
  const failedCount = visible.length - loaded.length;
  const stats = useMemo(() => summarize(loaded), [loaded]);
  const teachers = useMemo(() => rankTeachers(loaded), [loaded]);

  const exportCsv = () => {
    const blob = new Blob([buildCsv(loaded)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-lop-hoc-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Đã xuất báo cáo CSV.');
  };

  const actions = <>
    <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Làm mới</Button>
    <Button variant="secondary" onClick={exportCsv} disabled={loading || loaded.length === 0}><Download size={16} /> Xuất CSV</Button>
  </>;
  const desc = `Tổng hợp tiến độ, điểm số và hiệu quả giảng dạy từ các lớp học.${data ? ` Cập nhật lúc ${data.loadedAt.toLocaleTimeString('vi-VN')}.` : ''}`;
  const header = <PortalHeader title="Báo cáo chất lượng" desc={desc} actions={actions} />;

  if (error && !data) return <>{header}<LoadError message={error} onRetry={load} /></>;
  if (!data) return <>{header}<div className="p-10 text-center text-slate-500">Đang tải báo cáo...</div></>;

  const rows = visible.map((r) => {
    const name = <button type="button" className="text-left font-semibold text-[#1168bd] hover:underline" onClick={() => navigate(`/manager/classes/${r.cls.id}`)}>{r.cls.name}</button>;
    const [statusLabel, statusTone] = CLASS_STATUS[r.cls.status] || [r.cls.status, 'gray'];
    if (r.failed) return [name, r.cls.course?.title || '—', r.cls.teacher?.fullName || '—', <Badge key="s" tone={statusTone}>{statusLabel}</Badge>, <Badge key="f" tone="red">Không tải được bảng điểm</Badge>, '—', '—', '—'];
    return [
      name,
      r.cls.course?.title || '—',
      r.cls.teacher?.fullName || '—',
      <Badge key="s" tone={statusTone}>{statusLabel}</Badge>,
      r.students,
      fmt(r.avgProgress, '%'),
      fmt(r.avgScore),
      r.ungraded || 0
    ];
  });

  return <>
    {header}
    <div className="tabs-card">
      <div className="tabs">
        {STATUS_TABS.map(([value, label]) => (
          <button key={value || 'all'} type="button" className={`tab ${status === value ? 'active' : ''}`} onClick={() => setStatus(value)}>{label}</button>
        ))}
      </div>
    </div>
    {data.totalClasses > data.reports.length && <p className="mb-3 text-xs text-slate-500">Báo cáo tính trên {data.reports.length} lớp mới nhất (hệ thống có {data.totalClasses} lớp).</p>}
    {failedCount > 0 && <p className="mb-3 text-xs text-red-600">{failedCount} lớp không tải được bảng điểm nên chưa được tính vào số liệu. Bấm Làm mới để thử lại.</p>}

    <div className="stats-grid">
      <StatCard icon={GraduationCap} label="Lớp học" value={stats.classes} sub={`${stats.activeClasses} đang hoạt động`} />
      <StatCard icon={Users} label="Học viên" value={stats.students} sub="đang học trong các lớp" />
      <StatCard icon={Trophy} label="Điểm tổng kết TB" value={fmt(stats.avgScore)} sub="thang 10, trung bình theo học viên" />
      <StatCard icon={TrendingUp} label="Học hết bài học" value={fmt(stats.completionRate, '%')} sub={`${stats.completed}/${stats.students} học viên · tiến độ TB ${fmt(stats.avgProgress, '%')}`} />
    </div>

    <div className="dashboard-grid">
      <Card>
        <SectionTitle title="Phân bố xếp loại học viên" />
        {stats.students === 0 ? <p className="text-sm text-slate-500">Chưa có học viên nào để thống kê.</p> : RANKINGS.map((label) => {
          const count = stats.distribution[label];
          const percent = Math.round((count / stats.students) * 1000) / 10;
          return <div className="progress-row" key={label}>
            <div><span><Badge tone={RANKING_TONE[label]}>{label}</Badge></span><b>{count} học viên · {percent}%</b></div>
            <Progress value={percent} />
          </div>;
        })}
      </Card>
      <Card>
        <SectionTitle title="Xếp hạng giảng viên" />
        {teachers.length === 0 ? <p className="text-sm text-slate-500">Chưa có lớp học nào.</p> : teachers.slice(0, 8).map((t, i) => (
          <div className="rank-row" key={`${t.name}-${i}`}>
            <b>{String(i + 1).padStart(2, '0')}</b>
            <div><strong>{t.name}</strong><small>{t.avgScore === null ? 'Chưa có điểm' : `${fmt(t.avgScore)} điểm TB`} · {t.students} học viên · {t.classes} lớp</small></div>
          </div>
        ))}
      </Card>
    </div>

    <Card>
      <SectionTitle title="Chi tiết theo lớp học" />
      {rows.length === 0
        ? <p className="text-sm text-slate-500">Không có lớp học nào ở trạng thái này.</p>
        : <Table headers={['Lớp học', 'Khóa học', 'Giảng viên', 'Trạng thái', 'Học viên', 'Tiến độ TB', 'Điểm TB', 'Bài chờ chấm']} rows={rows} />}
    </Card>
  </>;
}
