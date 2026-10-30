import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Button, Card } from '../portal/PortalUI';
import discussionService from '../../services/discussionService';
import courseService from '../../services/courseService';
import DiscussionThread from '../discussion/DiscussionThread';

const FILTERS = [['open', 'Chưa giải đáp'], ['resolved', 'Đã giải đáp'], ['all', 'Tất cả']];

/**
 * Tab "Thảo luận" của lớp (giảng viên phụ trách, Quản lý, Admin) - docs/api/api-discussions.md mục 2.7.
 * Giảng viên phụ trách trả lời được; Quản lý và Admin chỉ xem và xóa bài vi phạm.
 */
export default function ClassDiscussionsTab({ cls }) {
  const [status, setStatus] = useState('open');
  const [lessonId, setLessonId] = useState('');
  const [page, setPage] = useState(1);
  const [lessons, setLessons] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Danh sách bài học để lọc (không bắt buộc: lỗi thì chỉ ẩn ô lọc)
  useEffect(() => {
    if (!cls.course?.id) return undefined;
    let cancelled = false;
    courseService.curriculum(cls.course.id)
      .then((outline) => {
        if (cancelled) return;
        setLessons((outline?.chapters || []).flatMap((chapter) => chapter.lessons || []));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [cls.course?.id]);

  const load = useCallback(async () => {
    try {
      const result = await discussionService.listByClass(cls.id, { status, page, limit: 10, ...(lessonId ? { lessonId } : {}) });
      setData(result);
      setError('');
    } catch (err) {
      setError(err?.message || 'Không thể tải thảo luận của lớp.');
    } finally {
      setLoading(false);
    }
  }, [cls.id, status, lessonId, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const changeStatus = (value) => { setStatus(value); setPage(1); };
  const changeLesson = (value) => { setLessonId(value); setPage(1); };

  const summary = data?.summary;
  const meta = data?.meta;
  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="orange">{summary?.open ?? 0} chưa giải đáp</Badge>
            <Badge tone="green">{summary?.resolved ?? 0} đã giải đáp</Badge>
            <small className="text-slate-500">Tổng {summary?.total ?? 0} câu hỏi</small>
          </div>
          {lessons.length > 0 && (
            <label className="field !mb-0">
              <select value={lessonId} onChange={(event) => changeLesson(event.target.value)}>
                <option value="">Tất cả bài học</option>
                {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
              </select>
            </label>
          )}
        </div>
        <div className="tabs mt-3">
          {FILTERS.map(([value, label]) => (
            <button key={value} className={`tab ${status === value ? 'active' : ''}`} onClick={() => changeStatus(value)}>{label}</button>
          ))}
        </div>
      </Card>

      {loading && <p className="py-8 text-center text-slate-500">Đang tải thảo luận...</p>}

      {!loading && error && (
        <Card>
          <div className="py-6 text-center text-slate-500">
            <p className="mb-3">{error}</p>
            <Button variant="secondary" onClick={() => { setLoading(true); load(); }}>Thử lại</Button>
          </div>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card><p className="py-6 text-center text-slate-500">Không có câu hỏi nào trong mục này.</p></Card>
      )}

      {!loading && !error && items.map((item) => (
        <DiscussionThread key={item.id} item={item} canReply={Boolean(data?.canPost)} lessonTitle={item.lesson?.title} onChanged={load} />
      ))}

      {!loading && !error && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <small className="text-slate-500">Trang {meta.page}/{meta.totalPages} · {meta.totalItems} câu hỏi</small>
          <Button variant="secondary" disabled={!meta.hasPreviousPage} onClick={() => setPage(page - 1)} aria-label="Trang trước"><ChevronLeft size={15} /></Button>
          <Button variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage(page + 1)} aria-label="Trang sau"><ChevronRight size={15} /></Button>
        </div>
      )}
    </div>
  );
}
