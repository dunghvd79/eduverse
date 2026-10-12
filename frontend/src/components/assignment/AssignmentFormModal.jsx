import React, { useEffect, useState } from 'react';
import { Button, Field } from '../portal/PortalUI';
import courseService from '../../services/courseService';
import assignmentService from '../../services/assignmentService';
import { toast } from '../common/Toast';

const toForm = (assignment, lesson) => ({
  title: assignment?.title || lesson?.title || '',
  instruction: assignment?.instruction || '',
  allowedFileTypes: assignment?.allowedFileTypes || 'pdf,zip,docx',
  maxFileSizeMb: String(assignment?.maxFileSizeMb ?? 25)
});

/**
 * Tạo bài tập (chọn khóa đang soạn -> bài học loại "Bài tập" chưa có đề) hoặc sửa bài tập.
 * lesson: { id, title } truyền sẵn khi mở từ trang Soạn đề cương.
 */
export default function AssignmentFormModal({ assignment = null, lesson = null, onClose, onSaved }) {
  const isEdit = Boolean(assignment);
  const [form, setForm] = useState(() => toForm(assignment, lesson));
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState(lesson?.id || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit || lesson) return;
    courseService.list({ mine: true, limit: 100 })
      .then(data => setCourses((data.items || []).filter(c => c.status === 'draft' || c.status === 'rejected')))
      .catch(error => toast.error(error?.message || 'Không thể tải khóa học.'));
  }, [isEdit, lesson]);

  useEffect(() => {
    // Mở từ trang Soạn đề cương: bài học đã chọn sẵn
    if (lesson) return;
    setLessonId('');
    setLessons([]);
    if (!courseId) return;
    courseService.curriculum(courseId)
      .then(data => setLessons((data.chapters || []).flatMap(ch => (ch.lessons || [])
        .filter(l => l.lessonType === 'assignment' && !l.assignmentId)
        .map(l => ({ ...l, chapterTitle: ch.title })))))
      .catch(error => toast.error(error?.message || 'Không thể tải đề cương.'));
  }, [courseId]);

  const set = (key) => (event) => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!isEdit && !lessonId) {
      toast.error('Vui lòng chọn bài học loại "Bài tập".');
      return;
    }
    if (form.title.trim().length < 5) {
      toast.error('Tiêu đề bài tập phải có ít nhất 5 ký tự.');
      return;
    }
    if (!form.instruction.trim()) {
      toast.error('Vui lòng nhập đề bài.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      instruction: form.instruction.trim(),
      allowedFileTypes: form.allowedFileTypes,
      maxFileSizeMb: Number(form.maxFileSizeMb)
    };
    try {
      setSaving(true);
      const saved = isEdit ? await assignmentService.update(assignment.id, payload) : await assignmentService.create({ ...payload, lessonId });
      toast.success(isEdit ? 'Đã cập nhật bài tập.' : 'Đã tạo bài tập. Giao bài cho lớp trong trang Lớp học.');
      onSaved(saved);
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'Không thể lưu bài tập.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal space-y-3 max-h-[90vh] overflow-y-auto !w-[min(640px,100%)]" onSubmit={submit}>
        <div className="modal-head">
          <h2>{isEdit ? 'Sửa bài tập' : 'Tạo bài tập'}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        {!isEdit && !lesson && (
          <>
            <Field label="Khóa học (đang soạn)">
              <select value={courseId} onChange={e => setCourseId(e.target.value)}>
                <option value="">— Chọn khóa học —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </Field>
            <Field label='Bài học loại "Bài tập"'>
              <select value={lessonId} onChange={e => {
                setLessonId(e.target.value);
                const picked = lessons.find(l => l.id === e.target.value);
                if (picked && !form.title) setForm(prev => ({ ...prev, title: picked.title }));
              }} disabled={!courseId}>
                <option value="">{courseId && lessons.length === 0 ? '— Khóa học chưa có bài "Bài tập" trống —' : '— Chọn bài học —'}</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.chapterTitle} › {l.title}</option>)}
              </select>
            </Field>
            {courses.length === 0 && (
              <p className="text-xs text-slate-500">Chỉ tạo được bài tập cho khóa học đang ở trạng thái Bản nháp / Bị từ chối. Thêm bài học loại "Bài tập" trong trang Soạn đề cương trước.</p>
            )}
          </>
        )}
        {lesson && <p className="text-sm text-slate-600">Bài học: <b>{lesson.title}</b></p>}

        <Field label="Tiêu đề bài tập" value={form.title} onChange={set('title')} placeholder="VD: Xây dựng REST API quản lý người dùng" />
        <label className="field">
          <span>Đề bài & hướng dẫn nộp</span>
          <textarea rows="8" value={form.instruction} onChange={set('instruction')} placeholder="Yêu cầu, tiêu chí chấm, quy cách đặt tên file..." />
        </label>
        <div className="form-grid">
          <Field label="Định dạng cho phép (phân cách bằng dấu phẩy)" value={form.allowedFileTypes} onChange={set('allowedFileTypes')} placeholder="pdf,zip,docx" />
          <Field label="Dung lượng tối đa (MB, 1-100)" type="number" min="1" max="100" value={form.maxFileSizeMb} onChange={set('maxFileSizeMb')} />
        </div>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo bài tập'}</Button>
        </div>
      </form>
    </div>
  );
}
