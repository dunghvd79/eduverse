import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { PortalHeader, Button, Card, Table, Badge } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import { toast } from '../../components/common/Toast';

const PAGE_SIZE = 20;

const STATUS_TABS = [
  ['', 'Tất cả'],
  ['draft', 'Bản nháp'],
  ['pending', 'Chờ duyệt'],
  ['published', 'Đã duyệt'],
  ['rejected', 'Từ chối']
];
const STATUS_LABEL = { draft: 'Bản nháp', pending: 'Chờ duyệt', published: 'Đã duyệt', rejected: 'Từ chối' };
const STATUS_TONE = { draft: 'gray', pending: 'orange', published: 'green', rejected: 'red' };

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const requestId = useRef(0);

  const load = async () => {
    const current = ++requestId.current;
    try {
      setLoading(true);
      const data = await courseService.list({
        page,
        limit: PAGE_SIZE,
        ...(status ? { status } : {}),
        ...(search ? { search } : {})
      });
      if (current !== requestId.current) return;
      setCourses(data.items || []);
      setMeta(data.meta || null);
    } catch (error) {
      if (current === requestId.current) {
        toast.error(error?.message || 'Không thể tải danh sách khóa học.');
      }
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, status, search]);

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const remove = async (course) => {
    const warning = course.status === 'published'
      ? '\n\nKhóa học này đang công khai. Nếu đã có lớp học dùng khóa này, các lớp đó có thể không còn hiển thị trong danh sách lớp.'
      : '';
    if (!window.confirm(`Xóa khóa học "${course.title}"?${warning}`)) return;

    try {
      setDeletingId(course.id);
      await courseService.remove(course.id);
      toast.success('Đã xóa khóa học.');
      if (courses.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa khóa học.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PortalHeader
        eyebrow="COURSE ADMIN"
        title="Quản lý khóa học"
        desc="Xem toàn bộ khóa học trên hệ thống và xóa khóa học không còn dùng (xóa mềm, dữ liệu vẫn còn trong cơ sở dữ liệu)."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw size={16} /> Làm mới
          </Button>
        }
      />

      <div className="filter-bar">
        <div className="tabs">
          {STATUS_TABS.map(([value, label]) => (
            <button
              key={value || 'all'}
              type="button"
              className={`tab ${status === value ? 'active' : ''}`}
              onClick={() => changeStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <form className="flex items-center gap-2" onSubmit={submitSearch}>
          <input
            className="h-9 w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên khóa học..."
          />
          <Button type="submit" variant="secondary">Tìm</Button>
        </form>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : courses.length === 0 ? (
          <div className="p-10 text-center text-slate-500">Không có khóa học nào phù hợp.</div>
        ) : (
          <Table
            headers={['Khóa học', 'Danh mục', 'Giảng viên', 'Bài học', 'Cập nhật', 'Trạng thái', 'Thao tác']}
            rows={courses.map(course => [
              <b>{course.title}</b>,
              course.category?.name || <span className="text-slate-400">Chưa chọn</span>,
              course.owner?.fullName || '—',
              course.totalLessons ?? 0,
              course.updatedAt ? new Date(course.updatedAt).toLocaleString('vi-VN') : '—',
              <Badge tone={STATUS_TONE[course.status] || 'gray'}>{STATUS_LABEL[course.status] || course.status}</Badge>,
              <Button
                variant="ghost"
                style={{ color: '#dc2626' }}
                disabled={deletingId === course.id}
                onClick={() => remove(course)}
              >
                <Trash2 size={15} /> {deletingId === course.id ? 'Đang xóa...' : 'Xóa'}
              </Button>
            ])}
          />
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Trang {meta.page}/{meta.totalPages} · {meta.totalItems} khóa học</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!meta.hasPreviousPage || loading} onClick={() => setPage(p => p - 1)}>
              Trước
            </Button>
            <Button variant="secondary" disabled={!meta.hasNextPage || loading} onClick={() => setPage(p => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      )}
    </>
  );
}