import React, { useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '../portal/PortalUI';
import { toast } from '../common/Toast';
import discussionService from '../../services/discussionService';
import DiscussionThread, { ComposeBox } from './DiscussionThread';

const PAGE_SIZE = 10;
const FILTERS = [['all', 'Tất cả'], ['open', 'Chưa giải đáp'], ['resolved', 'Đã giải đáp']];

/**
 * Khu "Thảo luận / Hỏi đáp" ở cuối bài học (docs/api/api-discussions.md).
 * Mỗi cuộc thảo luận thuộc về một lớp + một bài học. Không real-time: tải lại khi thao tác hoặc đổi bộ lọc.
 */
export default function LessonDiscussion({ classId, lessonId }) {
  const [status, setStatus] = useState('all');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Tải lại từ trang 1 đến trang đang xem để giữ nguyên số bài đã mở sau mỗi thao tác
  const [pages, setPages] = useState(1);

  const load = useCallback(async (pageCount = pages) => {
    try {
      const first = await discussionService.listByLesson(classId, lessonId, { status, page: 1, limit: PAGE_SIZE * pageCount });
      setData(first);
      setError('');
    } catch (err) {
      setError(err?.message || 'Không thể tải thảo luận.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [classId, lessonId, status, pages]);

  useEffect(() => {
    setLoading(true);
    setPages(1);
    load(1);
  }, [classId, lessonId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const showMore = async () => {
    const next = pages + 1;
    setLoadingMore(true);
    setPages(next);
    await load(next);
  };

  const ask = async (content) => {
    await discussionService.ask(classId, lessonId, content);
    toast.success('Đã đăng câu hỏi.');
    await load();
  };

  const items = data?.items || [];
  const meta = data?.meta;
  const hasMore = Boolean(meta && items.length < meta.totalItems);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold"><MessageCircle size={20} /> Thảo luận &amp; hỏi đáp{meta ? ` (${meta.totalItems})` : ''}</h2>
        <div className="tabs">
          {FILTERS.map(([value, label]) => (
            <button key={value} className={`tab ${status === value ? 'active' : ''}`} onClick={() => setStatus(value)}>{label}</button>
          ))}
        </div>
      </div>

      {data?.canPost ? (
        <ComposeBox
          placeholder="Bạn có thắc mắc về bài học này? Hãy đặt câu hỏi cho giảng viên và các bạn trong lớp..."
          submitLabel="Đăng câu hỏi"
          onSubmit={ask}
        />
      ) : (
        data && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Lớp học đang tạm dừng hoặc đã kết thúc nên thảo luận chỉ có thể xem.</p>
      )}

      {loading && <p className="py-6 text-center text-slate-500">Đang tải thảo luận...</p>}

      {!loading && error && (
        <div className="py-6 text-center text-slate-500">
          <p className="mb-3">{error}</p>
          <Button variant="secondary" onClick={() => { setLoading(true); load(); }}>Thử lại</Button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="py-6 text-center text-slate-500">
          {status === 'all' ? 'Chưa có câu hỏi nào cho bài học này. Hãy là người đầu tiên đặt câu hỏi!' : 'Không có câu hỏi nào trong mục này.'}
        </p>
      )}

      {!loading && !error && items.map((item) => (
        <DiscussionThread key={item.id} item={item} canReply={Boolean(data?.canPost)} onChanged={() => load()} />
      ))}

      {!loading && !error && hasMore && (
        <div className="text-center">
          <Button variant="secondary" onClick={showMore} disabled={loadingMore}>{loadingMore ? 'Đang tải...' : 'Xem thêm câu hỏi'}</Button>
        </div>
      )}
    </section>
  );
}
