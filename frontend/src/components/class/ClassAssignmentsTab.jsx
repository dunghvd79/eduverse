import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Table, Badge, Field } from '../portal/PortalUI';
import assignmentService from '../../services/assignmentService';
import { formatDateTime } from '../../services/quizService';
import { toast } from '../common/Toast';
import { fromLocalInput, toLocalInput } from '../../utils/datetime';

const windowBadge = (item) => {
  if (!item.isScheduled) return ['Chưa giao', 'gray'];
  if (item.isClosed) return ['Đã đóng', 'gray'];
  if (item.isLatePeriod) return ['Đang nhận nộp muộn', 'orange'];
  if (item.isOpen) return ['Đang nhận bài', 'green'];
  return ['Chưa mở', 'blue'];
};

/**
 * Giao bài / đổi lịch: mở đề, hạn nộp, cho phép nộp muộn, hạn chót tuyệt đối
 */
function ScheduleModal({ cls, item, onClose, onSaved }) {
  const [form, setForm] = useState({
    openTime: toLocalInput(item.openTime),
    deadline: toLocalInput(item.deadline),
    allowLateSubmission: item.allowLateSubmission ?? true,
    cutoffTime: item.allowLateSubmission ? toLocalInput(item.cutoffTime) : ''
  });
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.deadline) {
      toast.error('Vui lòng chọn hạn nộp.');
      return;
    }
    if (form.openTime && form.deadline <= form.openTime) {
      toast.error('Hạn nộp phải sau thời điểm mở đề.');
      return;
    }
    if (form.allowLateSubmission && form.cutoffTime && form.cutoffTime < form.deadline) {
      toast.error('Hạn chót nhận bài muộn phải sau hạn nộp.');
      return;
    }
    try {
      setSaving(true);
      await assignmentService.schedule(cls.id, item.id, {
        ...(form.openTime ? { openTime: fromLocalInput(form.openTime) } : {}),
        deadline: fromLocalInput(form.deadline),
        allowLateSubmission: form.allowLateSubmission,
        cutoffTime: form.allowLateSubmission ? fromLocalInput(form.cutoffTime) : null
      });
      toast.success(item.isScheduled ? 'Đã cập nhật lịch nộp.' : 'Đã giao bài cho lớp.');
      onSaved();
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'Không thể lưu lịch nộp.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal space-y-3" onSubmit={submit}>
        <div className="modal-head">
          <h2>{item.isScheduled ? 'Đổi lịch nộp' : 'Giao bài'}: {item.title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <p className="text-sm text-slate-500">Áp dụng cho lớp "{cls.name}".</p>
        <div className="form-grid">
          <Field label="Mở nhận bài từ (để trống = ngay bây giờ)" type="datetime-local" value={form.openTime} onChange={e => setForm({ ...form, openTime: e.target.value })} />
          <Field label="Hạn nộp (deadline)" type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.allowLateSubmission} onChange={e => setForm({ ...form, allowLateSubmission: e.target.checked })} />
          Cho phép nộp muộn sau hạn nộp (bài nộp muộn được đánh dấu)
        </label>
        <p className="-mt-1 text-xs text-slate-500">
          {form.allowLateSubmission
            ? 'Bỏ chọn nếu muốn khóa nộp bài ngay khi hết hạn.'
            : 'Học viên sẽ không nộp được bài sau thời điểm hạn nộp.'}
        </p>
        {form.allowLateSubmission && (
          <Field label="Hạn chót nhận bài muộn (để trống = không giới hạn)" type="datetime-local" value={form.cutoffTime} onChange={e => setForm({ ...form, cutoffTime: e.target.value })} />
        )}
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : item.isScheduled ? 'Lưu lịch' : 'Giao bài'}</Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Tab "Bài tập" trong trang quản lý lớp: giao bài, lịch nộp, thống kê, vào trang chấm.
 * Giao bài & chấm: GV phụ trách lớp hoặc Admin. Quản lý chỉ xem thống kê.
 */
export default function ClassAssignmentsTab({ cls, role }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const canGrade = role === 'admin' || cls.permissions?.canManageMembers;

  const load = () => assignmentService.classAssignments(cls.id)
    .then(data => setItems(data.items || []))
    .catch(error => { toast.error(error?.message || 'Không thể tải bài tập.'); setItems([]); });

  useEffect(() => { load(); }, [cls.id]);

  if (!items) return <Card><div className="p-6 text-center text-slate-500">Đang tải bài tập...</div></Card>;

  const gradeUrl = (item) => `/${role === 'admin' ? 'admin' : 'teacher'}/classes/${cls.id}/assignments/${item.id}/grade`;

  return (
    <Card>
      {items.length === 0 ? (
        <p className="p-6 text-center text-slate-500">Khóa học của lớp chưa có bài tập nào.</p>
      ) : (
        <Table
          headers={['Bài tập', 'Hạn nộp', 'Trạng thái', 'Đã nộp', 'Cần chấm', 'Chưa nộp', '']}
          rows={items.map(item => {
            const [label, tone] = windowBadge(item);
            return [
              <div><b>{item.title}</b><div className="text-xs text-slate-500">{item.lessonTitle} · {item.allowedFileTypes} · tối đa {item.maxFileSizeMb}MB</div></div>,
              <span className="text-xs whitespace-nowrap">{item.isScheduled ? formatDateTime(item.deadline) : '—'}</span>,
              <Badge tone={tone}>{label}</Badge>,
              item.isScheduled ? `${item.stats.submittedCount}/${item.stats.totalEnrolled}` : '—',
              item.isScheduled ? (item.stats.needsGradingCount ? <Badge tone="orange">{item.stats.needsGradingCount}</Badge> : 0) : '—',
              item.isScheduled ? item.stats.missingCount : '—',
              canGrade ? (
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => setEditing(item)} aria-label={`${item.isScheduled ? 'Đổi lịch' : 'Giao'} ${item.title}`}>
                    <CalendarClock size={15} /> {item.isScheduled ? 'Lịch' : 'Giao bài'}
                  </Button>
                  {item.isScheduled && <Button variant="ghost" onClick={() => navigate(gradeUrl(item))}>Chấm bài</Button>}
                </div>
              ) : null
            ];
          })}
        />
      )}
      {editing && <ScheduleModal cls={cls} item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </Card>
  );
}
