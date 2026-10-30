import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader, Button, Card, Table, Badge, StatCard } from '../portal/PortalUI';
import ClassFormModal from './ClassFormModal';
import classService, { CLASS_STATUS, formatDate } from '../../services/classService';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../common/Toast';
import { useUrlSearch } from '../../utils/useUrlSearch';

const STATUS_TABS = [['', 'Tất cả'], ['active', 'Đang hoạt động'], ['paused', 'Tạm dừng'], ['closed', 'Đã kết thúc']];
const PAGE_SIZE = 10;

/**
 * Danh sách lớp học dùng chung:
 * - Giảng viên (/teacher/classes): lớp mình phụ trách (GET /classes/my-classes), lọc phía client
 * - Quản lý / Admin (/manager/classes, /admin/classes): toàn bộ lớp (GET /classes) có tìm kiếm, lọc, phân trang
 */
export default function ClassListPage({ basePath }) {
  const navigate = useNavigate();
  const role = useAuthStore(state => state.user?.role);
  const isTeacher = role === 'teacher';

  const [classes, setClasses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  useUrlSearch(setSearch);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      if (isTeacher) {
        setClasses(await classService.myClasses());
        setMeta(null);
      } else {
        const data = await classService.list({ page, limit: PAGE_SIZE, ...(keyword ? { search: keyword } : {}), ...(status ? { status } : {}) });
        setClasses(data.items || []);
        setMeta(data.meta);
      }
    } catch (error) {
      toast.error(error?.message || 'Không thể tải danh sách lớp học.');
    } finally {
      setLoading(false);
    }
  };

  // Giảng viên lọc phía client nên không cần tải lại khi đổi bộ lọc
  const serverFilters = isTeacher ? '' : `${page}|${status}|${keyword}`;
  useEffect(() => {
    if (role) load();
  }, [role, serverFilters]);

  // Tìm kiếm sau khi ngừng gõ 400ms
  useEffect(() => {
    const timer = setTimeout(() => { setKeyword(search.trim()); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const visible = useMemo(() => {
    if (!isTeacher) return classes;
    const key = keyword.toLowerCase();
    return classes.filter(cls =>
      (!status || cls.status === status) &&
      (!key || cls.name.toLowerCase().includes(key) || cls.course?.title?.toLowerCase().includes(key))
    );
  }, [classes, isTeacher, status, keyword]);

  const stats = useMemo(() => ({
    active: classes.filter(cls => cls.status === 'active').length,
    students: classes.reduce((sum, cls) => sum + (cls.totalStudents || 0), 0)
  }), [classes]);

  return (
    <>
      <PortalHeader
        title={isTeacher ? 'Lớp học của tôi' : 'Quản lý lớp học'}
        desc={isTeacher ? 'Mở lớp từ khóa học đã công khai, quản lý mã tham gia và học viên.' : 'Toàn bộ lớp học trong hệ thống: mở lớp, phân công giảng viên, theo dõi tiến độ.'}
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Làm mới</Button>
            <Button onClick={() => setShowCreate(true)}><Plus size={17} /> Mở lớp mới</Button>
          </>
        }
      />

      {isTeacher && (
        <div className="stats-grid">
          <StatCard icon={Users} label="Lớp đang hoạt động" value={stats.active} />
          <StatCard icon={BookOpen} label="Tổng lớp phụ trách" value={classes.length} />
          <StatCard icon={Users} label="Tổng học viên" value={stats.students} />
        </div>
      )}

      <div className="filter-bar flex-wrap gap-3">
        <div className="tabs flex-wrap">
          {STATUS_TABS.map(([value, label]) => (
            <button key={value || 'all'} className={`tab ${status === value ? 'active' : ''}`} onClick={() => { setStatus(value); setPage(1); }}>
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 w-full md:w-64">
          <Search size={15} className="text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm lớp học..." className="flex-1 min-w-0 text-sm outline-none" />
        </label>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải lớp học...</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-3 text-slate-500" size={32} />
            <p className="text-slate-500">{classes.length === 0 && !keyword && !status ? 'Chưa có lớp học nào. Bấm "Mở lớp mới" để bắt đầu.' : 'Không có lớp học phù hợp.'}</p>
          </div>
        ) : (
          <Table
            headers={['Lớp học', 'Khóa học', ...(isTeacher ? [] : ['Giảng viên']), 'Mã lớp', 'Học viên', 'Thời gian', 'Trạng thái', '']}
            rows={visible.map(cls => {
              const [label, tone] = CLASS_STATUS[cls.status] || [cls.status, 'gray'];
              return [
                <b>{cls.name}</b>,
                cls.course?.title || '—',
                ...(isTeacher ? [] : [cls.teacher?.fullName || '—']),
                cls.classCode ? <code className="font-mono font-semibold">{cls.classCode}</code> : '—',
                cls.totalStudents ?? 0,
                <span className="text-xs whitespace-nowrap">{formatDate(cls.startDate)} – {formatDate(cls.endDate)}</span>,
                <Badge tone={tone}>{label}</Badge>,
                <Button variant="ghost" onClick={() => navigate(`${basePath}/${cls.id}`)}>Chi tiết</Button>
              ];
            })}
          />
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-4">
            <small className="text-slate-500">Trang {meta.page}/{meta.totalPages} · {meta.totalItems} lớp</small>
            <Button variant="secondary" disabled={!meta.hasPreviousPage} onClick={() => setPage(p => p - 1)} aria-label="Trang trước"><ChevronLeft size={15} /></Button>
            <Button variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage(p => p + 1)} aria-label="Trang sau"><ChevronRight size={15} /></Button>
          </div>
        )}
      </Card>

      {showCreate && (
        <ClassFormModal
          role={role}
          onClose={() => setShowCreate(false)}
          onSaved={(created) => { setShowCreate(false); navigate(`${basePath}/${created.id}`); }}
        />
      )}
    </>
  );
}
