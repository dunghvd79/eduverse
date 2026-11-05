import React, { useEffect, useState } from 'react';
import { Button, Field } from '../portal/PortalUI';
import courseService from '../../services/courseService';
import { toast } from '../common/Toast';

const SOURCE_TYPES = ['theory', 'video'];

/**
 * Chọn bài lý thuyết/video trong khóa học của giảng viên để lấy nội dung làm tài liệu cho AI.
 * onPick(text): nội dung các bài đã chọn, mỗi bài mở đầu bằng tiêu đề.
 */
export default function LessonSourceModal({ defaultCourseId = '', onPick, onClose }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [lessons, setLessons] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    courseService.list({ mine: true, limit: 100 })
      .then((data) => setCourses(data.items || []))
      .catch((error) => toast.error(error?.message || 'Không thể tải khóa học.'));
  }, []);

  useEffect(() => {
    setLessons([]);
    setSelected([]);
    if (!courseId) return;
    courseService.curriculum(courseId)
      .then((data) => setLessons((data.chapters || []).flatMap((chapter) => (chapter.lessons || [])
        .filter((lesson) => SOURCE_TYPES.includes(lesson.lessonType))
        .map((lesson) => ({ ...lesson, chapterTitle: chapter.title })))))
      .catch((error) => toast.error(error?.message || 'Không thể tải đề cương.'));
  }, [courseId]);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const pick = async () => {
    try {
      setLoading(true);
      const details = await Promise.all(lessons.filter((l) => selected.includes(l.id)).map((l) => courseService.getLesson(l.id)));
      const parts = details.filter((d) => d.contentText?.trim()).map((d) => `${d.title}\n${d.contentText.trim()}`);
      if (parts.length === 0) {
        toast.error('Các bài đã chọn chưa có nội dung chữ. Hãy chọn bài khác hoặc dán tài liệu thủ công.');
        return;
      }
      onPick(parts.join('\n\n'));
    } catch (error) {
      toast.error(error?.message || 'Không thể tải nội dung bài học.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="modal-head">
          <h2>Lấy nội dung từ bài học</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <Field label="Khóa học">
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">— Chọn khóa học —</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </Field>

        {courseId && (lessons.length === 0
          ? <p className="text-sm text-slate-500">Khóa học chưa có bài lý thuyết hoặc video.</p>
          : (
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-600">Chọn bài học ({selected.length}/{lessons.length})</span>
              {lessons.map((lesson) => (
                <label key={lesson.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-2 text-sm hover:bg-slate-50">
                  <input type="checkbox" className="mt-0.5 h-4 w-4" checked={selected.includes(lesson.id)} onChange={() => toggle(lesson.id)} />
                  <span className="min-w-0">
                    <b className="block font-semibold text-slate-800">{lesson.title}</b>
                    <small className="block text-xs text-slate-500">{lesson.chapterTitle}</small>
                  </span>
                </label>
              ))}
            </div>
          ))}

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="button" onClick={pick} disabled={selected.length === 0 || loading}>{loading ? 'Đang lấy...' : 'Lấy nội dung'}</Button>
        </div>
      </div>
    </div>
  );
}
