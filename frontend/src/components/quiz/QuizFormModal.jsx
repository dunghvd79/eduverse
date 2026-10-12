import React, { useEffect, useState } from 'react';
import { Button, Field } from '../portal/PortalUI';
import courseService from '../../services/courseService';
import quizService from '../../services/quizService';
import { toast } from '../common/Toast';

const DEFAULTS = { title: '', description: '', durationMinutes: '15', maxAttempts: '1', passScore: '5', showAnswersAfterSubmit: true };

const toForm = (quiz) => (quiz ? {
  title: quiz.title,
  description: quiz.description || '',
  durationMinutes: String(quiz.durationMinutes),
  maxAttempts: String(quiz.maxAttempts),
  passScore: String(quiz.passScore),
  showAnswersAfterSubmit: quiz.showAnswersAfterSubmit
} : DEFAULTS);

/**
 * Tạo đề mới (chọn khóa đang soạn -> bài học loại Quiz chưa có đề) hoặc sửa cấu hình đề.
 * lesson: { id, title } truyền sẵn khi tạo từ trang Soạn đề cương.
 */
export default function QuizFormModal({ quiz = null, lesson = null, onClose, onSaved }) {
  const isEdit = Boolean(quiz);
  const [form, setForm] = useState(() => ({ ...toForm(quiz), title: quiz?.title || lesson?.title || '' }));
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
    // Mở từ trang Soạn đề cương: bài học đã chọn sẵn, không có bước chọn khóa học
    if (lesson) return;
    setLessonId('');
    setLessons([]);
    if (!courseId) return;
    courseService.curriculum(courseId)
      .then(data => setLessons((data.chapters || []).flatMap(ch => (ch.lessons || [])
        .filter(l => l.lessonType === 'quiz' && !l.quizId)
        .map(l => ({ ...l, chapterTitle: ch.title })))))
      .catch(error => toast.error(error?.message || 'Không thể tải đề cương.'));
  }, [courseId]);

  const set = (key) => (event) => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!isEdit && !lessonId) {
      toast.error('Vui lòng chọn bài học loại Quiz.');
      return;
    }
    if (form.title.trim().length < 5) {
      toast.error('Tiêu đề bài kiểm tra phải có ít nhất 5 ký tự.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      durationMinutes: Number(form.durationMinutes),
      maxAttempts: Number(form.maxAttempts),
      passScore: Number(form.passScore),
      showAnswersAfterSubmit: form.showAnswersAfterSubmit
    };
    try {
      setSaving(true);
      const saved = isEdit ? await quizService.update(quiz.id, payload) : await quizService.create({ ...payload, lessonId });
      toast.success(isEdit ? 'Đã cập nhật cấu hình bài kiểm tra.' : 'Đã tạo bài kiểm tra. Hãy thêm câu hỏi.');
      onSaved(saved);
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'Không thể lưu bài kiểm tra.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal space-y-3 max-h-[90vh] overflow-y-auto" onSubmit={submit}>
        <div className="modal-head">
          <h2>{isEdit ? 'Cấu hình bài kiểm tra' : 'Tạo bài kiểm tra'}</h2>
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
            <Field label="Bài học loại Quiz">
              <select value={lessonId} onChange={e => {
                setLessonId(e.target.value);
                const picked = lessons.find(l => l.id === e.target.value);
                if (picked && !form.title) setForm(prev => ({ ...prev, title: picked.title }));
              }} disabled={!courseId}>
                <option value="">{courseId && lessons.length === 0 ? '— Khóa học chưa có bài Quiz trống —' : '— Chọn bài học —'}</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.chapterTitle} › {l.title}</option>)}
              </select>
            </Field>
            {courses.length === 0 && (
              <p className="text-xs text-slate-500">Chỉ tạo được đề cho khóa học đang ở trạng thái Bản nháp / Bị từ chối. Thêm bài học loại "Quiz" trong trang Soạn đề cương trước.</p>
            )}
          </>
        )}
        {lesson && <p className="text-sm text-slate-600">Bài học: <b>{lesson.title}</b></p>}

        <Field label="Tiêu đề bài kiểm tra" value={form.title} onChange={set('title')} placeholder="VD: Kiểm tra cuối chương 1" />
        <label className="field">
          <span>Hướng dẫn làm bài (tùy chọn)</span>
          <textarea rows="2" value={form.description} onChange={set('description')} />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Thời gian (phút)" type="number" min="5" max="180" value={form.durationMinutes} onChange={set('durationMinutes')} />
          <Field label="Số lần làm tối đa" type="number" min="1" max="10" value={form.maxAttempts} onChange={set('maxAttempts')} />
          <Field label="Điểm đạt (thang 10)" type="number" min="1" max="10" step="0.5" value={form.passScore} onChange={set('passScore')} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.showAnswersAfterSubmit} onChange={e => setForm(prev => ({ ...prev, showAnswersAfterSubmit: e.target.checked }))} />
          Cho học viên xem đáp án đúng và giải thích sau khi nộp bài
        </label>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : isEdit ? 'Lưu cấu hình' : 'Tạo bài kiểm tra'}</Button>
        </div>
      </form>
    </div>
  );
}
