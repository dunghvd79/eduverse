import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, FileArchive, RotateCcw, Save, Search, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalHeader, Button, Card, Table, Badge, StatCard } from '../../components/portal/PortalUI';
import assignmentService, { SUBMISSION_STATUS, formatFileSize } from '../../services/assignmentService';
import { formatDateTime } from '../../services/quizService';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../components/common/Toast';

const FILTERS = [
  ['', 'Tất cả'],
  ['needs_grading', 'Cần chấm'],
  ['missing', 'Chưa nộp'],
  ['graded', 'Đã chấm'],
  ['resubmission_requested', 'Yêu cầu nộp lại']
];

const isValidGrade = (value) => value !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 10;

const statusBadge = (item) => {
  if (item.needsGrading) return [item.grade !== null ? 'Nộp lại — chờ chấm lại' : (item.isLate ? 'Nộp muộn — chờ chấm' : 'Chờ chấm'), 'orange'];
  return SUBMISSION_STATUS[item.status] || [item.status, 'gray'];
};

// ==========================================
// MODAL CHẤM 1 BÀI
// ==========================================
function GradeModal({ submissionId, onClose, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState('grade'); // grade | resubmit
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    assignmentService.submission(submissionId)
      .then(data => {
        setDetail(data);
        setGrade(data.grade !== null ? String(data.grade) : '');
        setFeedback(data.feedback || '');
      })
      .catch(error => { toast.error(error?.message || 'Không thể tải bài nộp.'); onClose(); });
  }, [submissionId]);

  const saveGrade = async (event) => {
    event.preventDefault();
    if (!isValidGrade(grade)) {
      toast.error('Điểm phải là số từ 0 đến 10.');
      return;
    }
    try {
      setSaving(true);
      await assignmentService.grade(submissionId, { grade: Number(grade), feedback: feedback.trim() || null });
      toast.success(`Đã chấm ${detail.student.fullName}: ${Number(grade)} điểm.`);
      onSaved();
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'Không thể lưu điểm.');
    } finally {
      setSaving(false);
    }
  };

  const requestResubmit = async (event) => {
    event.preventDefault();
    if (reason.trim().length < 10) {
      toast.error('Lý do phải có ít nhất 10 ký tự.');
      return;
    }
    try {
      setSaving(true);
      await assignmentService.requestResubmission(submissionId, reason.trim());
      toast.success('Đã gửi yêu cầu nộp lại. Điểm cũ (nếu có) được giữ đến khi chấm lại.');
      onSaved();
    } catch (error) {
      toast.error(error?.message || 'Không thể gửi yêu cầu.');
    } finally {
      setSaving(false);
    }
  };

  if (!detail) {
    return <div className="modal-backdrop"><div className="modal text-center text-slate-500">Đang tải bài nộp...</div></div>;
  }

  return (
    <div className="modal-backdrop">
      <form className="modal space-y-3 max-h-[90vh] overflow-y-auto !w-[min(620px,100%)]" onSubmit={mode === 'grade' ? saveGrade : requestResubmit}>
        <div className="modal-head">
          <h2>Chấm bài: {detail.student.fullName}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <p className="text-sm text-slate-500">{detail.student.email} · {detail.assignment.title}</p>

        <div className="rounded-lg border border-slate-200 p-3 space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <b className="break-all">{detail.fileName}</b>
            <small className="text-slate-500">{formatFileSize(detail.fileSize)}</small>
            {detail.downloadUrl
              ? <a href={detail.downloadUrl} className="ml-auto inline-flex items-center gap-1 font-semibold text-primary"><Download size={15} /> Tải bài làm</a>
              : <small className="ml-auto text-amber-700">Chưa cấu hình S3 nên chưa tải được file</small>}
          </div>
          <div className="text-slate-600">
            Nộp lúc {formatDateTime(detail.submittedAt)}
            {detail.isLate && <Badge tone="orange">Muộn {detail.lateDurationMinutes} phút</Badge>}
          </div>
          {detail.studentNote && <p className="text-slate-700 whitespace-pre-wrap">💬 {detail.studentNote}</p>}
          {detail.resubmissionReason && <p className="text-amber-800">↺ Lần yêu cầu nộp lại gần nhất: {detail.resubmissionReason}</p>}
        </div>

        <div className="tabs">
          <button type="button" className={`tab ${mode === 'grade' ? 'active' : ''}`} onClick={() => setMode('grade')}>Chấm điểm</button>
          <button type="button" className={`tab ${mode === 'resubmit' ? 'active' : ''}`} onClick={() => setMode('resubmit')}>Yêu cầu nộp lại</button>
        </div>

        {mode === 'grade' ? (
          <>
            <label className="field">
              <span>Điểm (thang 10)</span>
              <input type="number" min="0" max="10" step="0.25" value={grade} onChange={e => setGrade(e.target.value)} autoFocus />
            </label>
            <label className="field">
              <span>Nhận xét cho học viên</span>
              <textarea rows="4" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Điểm mạnh, điểm cần cải thiện..." />
            </label>
          </>
        ) : (
          <label className="field">
            <span>Lý do yêu cầu nộp lại (học viên sẽ thấy, được nộp lại kể cả quá hạn)</span>
            <textarea rows="4" value={reason} onChange={e => setReason(e.target.value)} placeholder="VD: File zip bị lỗi không giải nén được, em nộp lại nhé." />
          </label>
        )}

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          {mode === 'grade'
            ? <Button type="submit" disabled={saving}><Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu điểm'}</Button>
            : <Button type="submit" variant="danger" disabled={saving}><RotateCcw size={15} /> Gửi yêu cầu nộp lại</Button>}
        </div>
      </form>
    </div>
  );
}

// ==========================================
// TRANG CHẤM BÀI CỦA LỚP
// ==========================================
export default function AssignmentGradingPage() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore(state => state.user?.role);
  const portal = role === 'admin' ? 'admin' : 'teacher';

  const [info, setInfo] = useState(null);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('submittedAt:DESC');
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState({}); // submissionId -> điểm đang nhập trên bảng
  const [grading, setGrading] = useState(null);
  const [zipping, setZipping] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    assignmentService.classAssignment(classId, assignmentId)
      .then(setInfo)
      .catch(error => { toast.error(error?.message || 'Không thể tải bài tập.'); navigate(`/${portal}/classes/${classId}`); });
    return () => clearTimeout(pollRef.current);
  }, [classId, assignmentId]);

  useEffect(() => {
    const timer = setTimeout(() => { setKeyword(search.trim()); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = async () => {
    try {
      const [sortBy, sortOrder] = sort.split(':');
      setData(await assignmentService.submissions(classId, assignmentId, {
        page, limit: 20, sortBy, sortOrder, ...(status ? { status } : {}), ...(keyword ? { search: keyword } : {})
      }));
    } catch (error) {
      toast.error(error?.message || 'Không thể tải danh sách bài nộp.');
    }
  };

  useEffect(() => { load(); }, [classId, assignmentId, status, keyword, sort, page]);

  const pendingGrades = useMemo(
    () => Object.entries(drafts).filter(([, value]) => isValidGrade(value)).map(([submissionId, value]) => ({ submissionId, grade: Number(value) })),
    [drafts]
  );

  const saveDrafts = async () => {
    const invalid = Object.values(drafts).filter(v => v !== '' && !isValidGrade(v)).length;
    if (invalid) {
      toast.error(`${invalid} ô điểm không hợp lệ (phải từ 0 đến 10).`);
      return;
    }
    try {
      const result = await assignmentService.bulkGrade(classId, assignmentId, pendingGrades);
      toast.success(`Đã lưu điểm ${result.totalUpdated} bài.`);
      setDrafts({});
      load();
    } catch (error) {
      toast.error(error?.message || 'Không thể lưu điểm.');
    }
  };

  const pollZip = (jobId) => {
    pollRef.current = setTimeout(async () => {
      try {
        const job = await assignmentService.downloadAllStatus(classId, assignmentId, jobId);
        if (job.status === 'completed') {
          setZipping(false);
          toast.success('File ZIP đã sẵn sàng, đang tải xuống...');
          window.location.assign(job.zipDownloadUrl);
        } else if (job.status === 'failed') {
          setZipping(false);
          toast.error(job.error || 'Nén file thất bại.');
        } else {
          pollZip(jobId);
        }
      } catch (error) {
        setZipping(false);
        toast.error(error?.message || 'Không kiểm tra được tiến trình nén.');
      }
    }, 3000);
  };

  const downloadAll = async () => {
    try {
      setZipping(true);
      const result = await assignmentService.downloadAll(classId, assignmentId);
      if (result.status === 'ready') {
        setZipping(false);
        toast.success(`Đã nén ${result.totalFiles} bài (${result.totalSizeMb} MB), đang tải xuống...`);
        window.location.assign(result.zipDownloadUrl);
      } else {
        toast.info(`Đang nén ${result.totalFiles} bài (${result.totalSizeMb} MB) trong nền, vui lòng chờ...`);
        pollZip(result.jobId);
      }
    } catch (error) {
      setZipping(false);
      toast.error(error?.message || 'Không thể tải bài nộp.');
    }
  };

  const summary = data?.summary;

  return (
    <>
      <PortalHeader
        title={info?.title || 'Chấm bài tập'}
        desc={info ? `${info.className} · Hạn nộp ${formatDateTime(info.deadline)}${info.allowLateSubmission ? ` · nhận bài muộn đến ${info.cutoffTime ? formatDateTime(info.cutoffTime) : 'không giới hạn'}` : ' · không nhận bài muộn'}` : ''}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/${portal}/classes/${classId}`)}><ArrowLeft size={16} /> Về lớp học</Button>
            <Button variant="secondary" onClick={downloadAll} disabled={zipping || !summary?.submittedCount}>
              <FileArchive size={15} /> {zipping ? 'Đang nén...' : 'Tải tất cả (ZIP)'}
            </Button>
            {pendingGrades.length > 0 && <Button onClick={saveDrafts}><Save size={15} /> Lưu {pendingGrades.length} điểm</Button>}
          </>
        }
      />

      {summary && (
        <div className="stats-grid">
          <StatCard icon={Users} label="Đã nộp" value={`${summary.submittedCount}/${summary.totalEnrolled}`} sub={`${summary.lateCount} nộp muộn`} />
          <StatCard icon={Clock3} label="Cần chấm" value={summary.needsGradingCount} />
          <StatCard icon={CheckCircle2} label="Đã chấm" value={summary.gradedCount} />
          <StatCard icon={Users} label="Chưa nộp" value={summary.missingCount} sub={summary.resubmissionRequestedCount ? `${summary.resubmissionRequestedCount} đang được yêu cầu nộp lại` : undefined} />
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="tabs flex-wrap">
            {FILTERS.map(([value, label]) => (
              <button key={value || 'all'} className={`tab ${status === value ? 'active' : ''}`} onClick={() => { setStatus(value); setPage(1); }}>{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="h-9 rounded-lg border border-slate-200 px-2 text-sm bg-white" aria-label="Sắp xếp">
              <option value="submittedAt:DESC">Nộp gần đây</option>
              <option value="submittedAt:ASC">Nộp sớm nhất</option>
              <option value="studentName:ASC">Tên A → Z</option>
              <option value="grade:DESC">Điểm cao trước</option>
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 w-full md:w-56">
              <Search size={15} className="text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm học viên..." className="flex-1 min-w-0 text-sm outline-none" />
            </label>
          </div>
        </div>

        {!data ? (
          <div className="p-6 text-center text-slate-500">Đang tải bài nộp...</div>
        ) : data.items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Không có bài nộp phù hợp.</div>
        ) : (
          <Table
            headers={['Học viên', 'Bài nộp', 'Nộp lúc', 'Trạng thái', 'Điểm', '']}
            rows={data.items.map(item => {
              const [label, tone] = statusBadge(item);
              const draft = drafts[item.submissionId];
              return [
                <div><b>{item.student.fullName}</b><div className="text-xs text-slate-500">{item.student.email}</div></div>,
                item.fileName ? <div className="max-w-[220px]"><div className="truncate text-sm">{item.fileName}</div><small className="text-slate-500">{formatFileSize(item.fileSize)}</small></div> : '—',
                item.submittedAt
                  ? <div className="text-xs whitespace-nowrap">{formatDateTime(item.submittedAt)}{item.isLate && <div className="text-amber-700">muộn {item.lateDurationMinutes} phút</div>}</div>
                  : '—',
                <Badge tone={tone}>{label}</Badge>,
                item.submissionId ? (
                  <input
                    type="number" min="0" max="10" step="0.25"
                    value={draft ?? (item.grade ?? '')}
                    onChange={e => setDrafts(prev => ({ ...prev, [item.submissionId]: e.target.value }))}
                    className={`w-20 rounded border px-2 h-8 text-sm ${draft !== undefined ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}
                    aria-label={`Điểm của ${item.student.fullName}`}
                  />
                ) : '—',
                item.submissionId ? <Button variant="ghost" onClick={() => setGrading(item.submissionId)}>Chấm</Button> : null
              ];
            })}
          />
        )}
        {data?.meta?.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-4">
            <small className="text-slate-500">Trang {data.meta.page}/{data.meta.totalPages}</small>
            <Button variant="secondary" disabled={!data.meta.hasPreviousPage} onClick={() => setPage(p => p - 1)} aria-label="Trang trước"><ChevronLeft size={15} /></Button>
            <Button variant="secondary" disabled={!data.meta.hasNextPage} onClick={() => setPage(p => p + 1)} aria-label="Trang sau"><ChevronRight size={15} /></Button>
          </div>
        )}
      </Card>

      {grading && (
        <GradeModal
          submissionId={grading}
          onClose={() => setGrading(null)}
          onSaved={() => { setGrading(null); setDrafts(prev => { const next = { ...prev }; delete next[grading]; return next; }); load(); }}
        />
      )}
    </>
  );
}
