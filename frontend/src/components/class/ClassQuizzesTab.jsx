import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Table, Badge, Field } from '../portal/PortalUI';
import quizService, { formatDateTime, formatScore } from '../../services/quizService';
import { toast } from '../common/Toast';

// <input type="datetime-local"> dùng giờ địa phương, không có múi giờ
const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

function ScheduleModal({ cls, quiz, onClose, onSaved }) {
  const [form, setForm] = useState({ openTime: toLocalInput(quiz.openTime), closeTime: toLocalInput(quiz.closeTime), isActive: quiz.isActive });
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (form.openTime && form.closeTime && form.closeTime <= form.openTime) {
      toast.error('Thời điểm đóng đề phải sau thời điểm mở đề.');
      return;
    }
    try {
      setSaving(true);
      await quizService.updateClassQuiz(cls.id, quiz.id, {
        openTime: fromLocalInput(form.openTime),
        closeTime: fromLocalInput(form.closeTime),
        isActive: form.isActive
      });
      toast.success('Đã cập nhật lịch bài kiểm tra.');
      onSaved();
    } catch (error) {
      toast.error(error?.message || 'Không thể cập nhật lịch.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal space-y-3" onSubmit={submit}>
        <div className="modal-head">
          <h2>Lịch mở đề: {quiz.title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <p className="text-sm text-slate-500">Áp dụng riêng cho lớp "{cls.name}". Để trống = không giới hạn.</p>
        <div className="form-grid">
          <Field label="Mở đề từ" type="datetime-local" value={form.openTime} onChange={e => setForm({ ...form, openTime: e.target.value })} />
          <Field label="Đóng đề lúc" type="datetime-local" value={form.closeTime} onChange={e => setForm({ ...form, closeTime: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
          Cho phép học viên làm bài (bỏ chọn để tạm khóa đề)
        </label>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu lịch'}</Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Tab "Bài kiểm tra" trong trang quản lý lớp: lịch mở đề theo lớp + thống kê.
 * Giảng viên có thêm nút xem kết quả chi tiết (trang soạn đề chỉ có ở portal giảng viên).
 */
export default function ClassQuizzesTab({ cls, role }) {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () => quizService.classQuizzes(cls.id)
    .then(setQuizzes)
    .catch(error => { toast.error(error?.message || 'Không thể tải bài kiểm tra.'); setQuizzes([]); });

  useEffect(() => { load(); }, [cls.id]);

  if (!quizzes) return <Card><div className="p-6 text-center text-slate-500">Đang tải bài kiểm tra...</div></Card>;

  return (
    <Card>
      {quizzes.length === 0 ? (
        <p className="p-6 text-center text-slate-500">Khóa học của lớp chưa có bài kiểm tra nào.</p>
      ) : (
        <Table
          headers={['Bài kiểm tra', 'Lịch mở', 'Trạng thái', 'Đã làm', 'Đạt', 'Điểm TB', '']}
          rows={quizzes.map(quiz => [
            <div><b>{quiz.title}</b><div className="text-xs text-slate-500">{quiz.lessonTitle} · {quiz.totalQuestions} câu · {quiz.durationMinutes} phút</div></div>,
            <span className="text-xs whitespace-nowrap">{quiz.openTime || quiz.closeTime ? `${formatDateTime(quiz.openTime)} → ${formatDateTime(quiz.closeTime)}` : 'Không giới hạn'}</span>,
            quiz.isAvailable ? <Badge tone="green">Đang mở</Badge> : <Badge tone={quiz.isPublished ? 'orange' : 'gray'}>{quiz.unavailableReason}</Badge>,
            `${quiz.stats.studentsAttempted}/${cls.totalStudents}`,
            quiz.stats.passedStudents,
            formatScore(quiz.stats.averageBestScore),
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => setEditing(quiz)} aria-label={`Đặt lịch ${quiz.title}`}><CalendarClock size={15} /> Lịch</Button>
              {role === 'teacher' && <Button variant="ghost" onClick={() => navigate(`/teacher/quizzes/${quiz.id}?tab=results&classId=${cls.id}`)}>Kết quả</Button>}
            </div>
          ])}
        />
      )}
      {editing && <ScheduleModal cls={cls} quiz={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </Card>
  );
}
