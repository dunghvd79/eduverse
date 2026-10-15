import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Download, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalHeader, Button, Card, SectionTitle, Badge } from '../../components/portal/PortalUI';
import assignmentService, { SUBMISSION_STATUS, formatFileSize } from '../../services/assignmentService';
import { getFileExtension } from '../../services/uploadService';
import { formatDateTime, formatScore } from '../../services/quizService';
import { timeLeft } from '../../utils/datetime';
import { toast } from '../../components/common/Toast';
import { confirmModal } from '../../components/common/ConfirmModal';

/**
 * Học viên xem đề, nộp / nộp lại bài tập, xem điểm & nhận xét
 */
export default function AssignmentDetailPage() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [mine, setMine] = useState(null);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      const [detail, my] = await Promise.all([
        assignmentService.classAssignment(classId, assignmentId),
        assignmentService.mySubmission(classId, assignmentId)
      ]);
      setAssignment(detail);
      setMine(my);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải bài tập.');
      navigate('/student/assignments', { replace: true });
    }
  };

  useEffect(() => { load(); }, [classId, assignmentId]);

  if (!assignment || !mine) return <div className="p-10 text-center text-slate-500">Đang tải bài tập...</div>;

  const allowed = assignment.allowedFileTypes.split(',');
  const submission = mine.submission;

  const chooseFile = (selected) => {
    if (!selected) return setFile(null);
    if (!allowed.includes(getFileExtension(selected.name))) {
      toast.error(`Chỉ nhận tệp: ${allowed.join(', ')}.`);
      fileInputRef.current.value = '';
      return setFile(null);
    }
    if (selected.size > assignment.maxFileSizeMb * 1024 * 1024) {
      toast.error(`Tệp tối đa ${assignment.maxFileSizeMb}MB.`);
      fileInputRef.current.value = '';
      return setFile(null);
    }
    setFile(selected);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return;
    if (submission) {
      const ok = await confirmModal({
        title: 'Nộp lại bài tập?',
        message: 'Nộp bài mới sẽ thay thế hoàn toàn tệp bài làm và ghi chú đã nộp trước đó.',
        subtext: 'Giảng viên sẽ chấm điểm dựa trên bài nộp mới nhất của bạn.',
        confirmText: 'Xác nhận nộp lại',
        cancelText: 'Hủy bỏ',
        type: 'warning'
      });
      if (!ok) return;
    }
    try {
      setSubmitting(true);
      const result = await assignmentService.submit(classId, assignmentId, file, note);
      toast.success(result.message || 'Nộp bài thành công!');
      setFile(null);
      setNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'Không thể nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  const [statusLabel, statusTone] = submission ? (SUBMISSION_STATUS[submission.status] || [submission.status, 'gray']) : ['Chưa nộp', 'gray'];

  return (
    <>
      <PortalHeader
        title={assignment.title}
        desc={`${assignment.className} · ${assignment.lessonTitle}`}
        actions={<Button variant="secondary" onClick={() => navigate(`/student/classes/${classId}`)}><ArrowLeft size={16} /> Về lớp học</Button>}
      />

      <div className="dashboard-grid">
        <Card>
          <SectionTitle title="Đề bài" />
          <div className="whitespace-pre-wrap text-slate-700 leading-7">{assignment.instruction}</div>
          <p className="mt-4 text-sm text-slate-500">Định dạng: <b>{assignment.allowedFileTypes}</b> · Dung lượng tối đa: <b>{assignment.maxFileSizeMb}MB</b></p>
        </Card>

        <Card>
          <SectionTitle title="Thời hạn" />
          <div className="space-y-2 text-sm">
            {assignment.openTime && <div>Mở nhận bài: <b>{formatDateTime(assignment.openTime)}</b></div>}
            <div className="flex items-center gap-2"><Clock3 size={16} /> Hạn nộp: <b>{formatDateTime(assignment.deadline)}</b></div>
            {assignment.isOpen && !submission && <div className={assignment.isLatePeriod ? 'text-red-600 font-semibold' : 'text-slate-600'}>{timeLeft(assignment.deadline)}</div>}
            <div className="text-slate-600">
              {assignment.allowLateSubmission
                ? `Cho phép nộp muộn${assignment.cutoffTime ? ` đến ${formatDateTime(assignment.cutoffTime)}` : ''} (bài nộp muộn được đánh dấu)`
                : 'Không nhận bài nộp muộn'}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Bài nộp của bạn" action={<Badge tone={statusTone}>{statusLabel}</Badge>} />
        {submission ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <div className="min-w-0 flex-1">
                <b className="block truncate">{submission.fileName}</b>
                <small className="text-slate-500">
                  {formatFileSize(submission.fileSize)} · nộp lúc {formatDateTime(submission.submittedAt)}
                  {submission.isLate && ` · muộn ${submission.lateDurationMinutes} phút`}
                </small>
              </div>
              {submission.downloadUrl && <a href={submission.downloadUrl} className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><Download size={15} /> Tải lại bài đã nộp</a>}
            </div>
            {submission.studentNote && <p className="text-sm text-slate-600">💬 Ghi chú của bạn: {submission.studentNote}</p>}
            {submission.status === 'resubmission_requested' && (
              <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle size={18} className="flex-shrink-0" />
                <div><b>Giảng viên yêu cầu nộp lại:</b> {submission.resubmissionReason}</div>
              </div>
            )}
            {submission.grade !== null && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-sm text-slate-600">Điểm{submission.needsGrading ? ' (lần chấm trước — bài mới đang chờ chấm lại)' : ''}</div>
                <div className="text-3xl font-extrabold text-emerald-700">{formatScore(submission.grade)}<small className="text-base text-slate-500">/10</small></div>
                {submission.feedback && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">📝 {submission.feedback}</p>}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Bạn chưa nộp bài.</p>
        )}

        {mine.canSubmit ? (
          <form onSubmit={submit} className="mt-4 space-y-2 rounded-lg border border-dashed border-slate-300 p-4">
            <b className="block text-sm">{submission ? 'Nộp lại bài (thay thế bài cũ)' : 'Nộp bài'}</b>
            <input ref={fileInputRef} type="file" accept={allowed.map(ext => `.${ext}`).join(',')} onChange={e => chooseFile(e.target.files?.[0])} disabled={submitting} className="block w-full text-sm" />
            {file && <small className="block text-slate-500">{file.name} · {formatFileSize(file.size)}</small>}
            <textarea rows="2" value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú cho giảng viên (tùy chọn)" maxLength={2000} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" disabled={submitting} />
            <Button type="submit" disabled={!file || submitting}><Upload size={15} /> {submitting ? 'Đang tải lên...' : submission ? 'Nộp lại' : 'Nộp bài'}</Button>
            {assignment.isLatePeriod && submission?.status !== 'resubmission_requested' && <p className="text-xs text-amber-700">Đã quá hạn nộp — bài nộp lúc này được ghi nhận là nộp muộn.</p>}
          </form>
        ) : mine.submitBlockedReason && (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><AlertCircle size={16} /> {mine.submitBlockedReason}</p>
        )}
      </Card>
    </>
  );
}
