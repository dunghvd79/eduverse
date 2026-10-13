import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Copy, Pencil,
  RefreshCw, Search, Trash2, UserMinus, UserPlus, Users
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalHeader, Button, Card, Table, Badge, StatCard, Progress } from '../portal/PortalUI';
import ClassFormModal from './ClassFormModal';
import ClassQuizzesTab from './ClassQuizzesTab';
import ClassAssignmentsTab from './ClassAssignmentsTab';
import ClassGradebook from './ClassGradebook';
import classService, { CLASS_STATUS, PROGRESS_STATUS, formatDate } from '../../services/classService';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../common/Toast';

const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();

const StudentCell = ({ student }) => (
  <div className="table-user">
    <div className="avatar sm">{initials(student.fullName)}</div>
    <b>{student.fullName}</b>
  </div>
);

const Pagination = ({ meta, onChange }) => (meta && meta.totalPages > 1 ? (
  <div className="flex items-center justify-end gap-2 pt-4">
    <small className="text-slate-500">Trang {meta.page}/{meta.totalPages} · {meta.totalItems} học viên</small>
    <Button variant="secondary" disabled={meta.page <= 1} onClick={() => onChange(meta.page - 1)} aria-label="Trang trước"><ChevronLeft size={15} /></Button>
    <Button variant="secondary" disabled={meta.page >= meta.totalPages} onClick={() => onChange(meta.page + 1)} aria-label="Trang sau"><ChevronRight size={15} /></Button>
  </div>
) : null);

const SearchBox = ({ value, onChange, placeholder }) => (
  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 w-full md:w-64">
    <Search size={15} className="text-slate-500" />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="flex-1 min-w-0 text-sm outline-none" />
  </label>
);

// Giá trị tìm kiếm chỉ cập nhật sau khi ngừng gõ
const useDebounced = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value.trim()), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// ==========================================
// TAB: HỌC VIÊN
// ==========================================
function MembersTab({ cls, canManageMembers, onChanged }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const keyword = useDebounced(search);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await classService.members(cls.id, { page, limit: 20, status, ...(keyword ? { search: keyword } : {}) });
      setItems(data.items || []);
      setMeta(data.meta);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải danh sách học viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [cls.id, page, status, keyword]);
  useEffect(() => { setPage(1); }, [status, keyword]);

  const addMember = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    try {
      setAdding(true);
      const member = await classService.addMember(cls.id, email.trim());
      toast.success(`Đã thêm ${member.fullName} vào lớp.`);
      setEmail('');
      await load();
      onChanged();
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'Không thể thêm học viên.');
    } finally {
      setAdding(false);
    }
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Xóa "${member.fullName}" khỏi lớp? Học viên sẽ không còn xem được nội dung bài học của lớp này.`)) return;
    try {
      await classService.removeMember(cls.id, member.studentId);
      toast.success('Đã xóa học viên khỏi lớp.');
      await load();
      onChanged();
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa học viên.');
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="tabs">
          {[['active', 'Đang học'], ['dropped', 'Đã rời lớp']].map(([value, label]) => (
            <button key={value} className={`tab ${status === value ? 'active' : ''}`} onClick={() => setStatus(value)}>{label}</button>
          ))}
        </div>
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc email..." />
      </div>

      {canManageMembers && cls.status !== 'closed' && (
        <form onSubmit={addMember} className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email học viên cần thêm..."
            className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 h-9 text-sm"
          />
          <Button type="submit" disabled={adding || !email.trim()}><UserPlus size={15} /> {adding ? 'Đang thêm...' : 'Thêm học viên'}</Button>
        </form>
      )}

      {loading ? (
        <div className="p-6 text-center text-slate-500">Đang tải học viên...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          {status === 'active' && !keyword ? 'Lớp chưa có học viên. Chia sẻ mã lớp để học viên tự tham gia.' : 'Không có học viên phù hợp.'}
        </div>
      ) : (
        <Table
          headers={['Học viên', 'Email', 'Ngày tham gia', 'Trạng thái', ...(canManageMembers && status === 'active' ? [''] : [])]}
          rows={items.map(member => [
            <StudentCell student={member} />,
            member.email,
            formatDate(member.enrolledAt),
            <Badge tone={member.status === 'active' ? 'green' : 'gray'}>{member.status === 'active' ? 'Đang học' : 'Đã rời lớp'}</Badge>,
            ...(canManageMembers && status === 'active'
              ? [<Button variant="ghost" onClick={() => removeMember(member)} aria-label={`Xóa ${member.fullName} khỏi lớp`}><UserMinus size={15} /></Button>]
              : [])
          ])}
        />
      )}
      <Pagination meta={meta} onChange={setPage} />
    </Card>
  );
}

// ==========================================
// TAB: TIẾN ĐỘ HỌC TẬP
// ==========================================
function ProgressTab({ cls }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('progress');
  const [order, setOrder] = useState('asc');
  const [search, setSearch] = useState('');
  const keyword = useDebounced(search);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    classService.progress(cls.id, { page, limit: 20, sortBy, order, ...(status ? { status } : {}), ...(keyword ? { search: keyword } : {}) })
      .then(result => { if (!cancelled) setData(result); })
      .catch(error => toast.error(error?.message || 'Không thể tải báo cáo tiến độ.'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cls.id, page, status, sortBy, order, keyword]);

  useEffect(() => { setPage(1); }, [status, sortBy, order, keyword]);

  const summary = data?.summary;

  return (
    <>
      {summary && (
        <div className="stats-grid">
          <StatCard icon={BarChart3} label="Tiến độ trung bình" value={`${summary.averageProgressPercentage}%`} sub={`${summary.totalLessons} bài học trong khóa`} />
          <StatCard icon={CheckCircle2} label="Đã hoàn thành" value={summary.completedCount} sub={`/${summary.totalStudents} học viên`} />
          <StatCard icon={Users} label="Đang học" value={summary.inProgressCount} />
          <StatCard icon={Users} label="Chưa bắt đầu" value={summary.notStartedCount} sub="Cần nhắc nhở" />
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="tabs flex-wrap">
            {[['', 'Tất cả'], ...Object.entries(PROGRESS_STATUS).map(([value, [label]]) => [value, label])].map(([value, label]) => (
              <button key={value || 'all'} className={`tab ${status === value ? 'active' : ''}`} onClick={() => setStatus(value)}>{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={`${sortBy}:${order}`} onChange={e => { const [s, o] = e.target.value.split(':'); setSortBy(s); setOrder(o); }} className="h-9 rounded-lg border border-slate-200 px-2 text-sm bg-white" aria-label="Sắp xếp">
              <option value="progress:asc">Tiến độ thấp trước</option>
              <option value="progress:desc">Tiến độ cao trước</option>
              <option value="name:asc">Tên A → Z</option>
              <option value="lastActiveAt:asc">Lâu chưa học trước</option>
              <option value="lastActiveAt:desc">Học gần đây trước</option>
            </select>
            <SearchBox value={search} onChange={setSearch} placeholder="Tìm học viên..." />
          </div>
        </div>

        {loading && !data ? (
          <div className="p-6 text-center text-slate-500">Đang tải báo cáo...</div>
        ) : !data?.items?.length ? (
          <div className="p-8 text-center text-slate-500">Không có học viên phù hợp.</div>
        ) : (
          <Table
            headers={['Học viên', 'Email', 'Tiến độ', 'Bài hoàn thành', 'Trạng thái', 'Học gần nhất']}
            rows={data.items.map(item => {
              const [label, tone] = PROGRESS_STATUS[item.status] || [item.status, 'gray'];
              return [
                <StudentCell student={item.student} />,
                item.student.email,
                <div className="table-progress"><Progress value={item.progressPercentage} /><small>{item.progressPercentage}%</small></div>,
                `${item.completedLessons}/${item.totalLessons}`,
                <Badge tone={tone}>{label}</Badge>,
                item.lastActiveAt ? new Date(item.lastActiveAt).toLocaleString('vi-VN') : <span className="text-slate-500">Chưa học</span>
              ];
            })}
          />
        )}
        <Pagination meta={data?.meta} onChange={setPage} />
      </Card>
    </>
  );
}

// ==========================================
// TRANG CHI TIẾT LỚP (Giảng viên / Quản lý / Admin)
// ==========================================
export default function ClassManagePage({ basePath, initialTab = 'members' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore(state => state.user?.role);
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [showEdit, setShowEdit] = useState(false);

  const load = async () => {
    try {
      const data = await classService.get(id);
      setCls(data);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải lớp học.');
      if (error?.statusCode === 404) navigate(basePath, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-10 text-center text-slate-500">Đang tải lớp học...</div>;
  if (!cls) return null;

  const { canManage, canManageMembers } = cls.permissions || {};
  const [statusLabel, statusTone] = CLASS_STATUS[cls.status] || [cls.status, 'gray'];

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(cls.classCode);
      toast.success('Đã sao chép mã lớp.');
    } catch {
      toast.error('Không thể sao chép, hãy chép tay mã lớp.');
    }
  };

  const regenerateCode = async () => {
    const custom = window.prompt('Nhập mã mới (4-20 ký tự chữ và số) hoặc để trống để hệ thống tự sinh.\nMã cũ sẽ không dùng để tham gia lớp được nữa.', '');
    if (custom === null) return;
    try {
      const data = await classService.regenerateCode(cls.id, custom.trim().toUpperCase());
      setCls(prev => ({ ...prev, classCode: data.newClassCode }));
      toast.success(`Mã lớp mới: ${data.newClassCode}`);
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'Không thể đổi mã lớp.');
    }
  };

  const deleteClass = async () => {
    if (!window.confirm(`Xóa lớp "${cls.name}"? Học viên sẽ không còn truy cập được lớp này.`)) return;
    try {
      await classService.remove(cls.id);
      toast.success('Đã xóa lớp học.');
      navigate(basePath, { replace: true });
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa lớp học.');
    }
  };

  return (
    <>
      <PortalHeader
        title={cls.name}
        desc={`${cls.course?.title || ''} · Giảng viên: ${cls.teacher?.fullName || '—'} · ${formatDate(cls.startDate)} – ${formatDate(cls.endDate)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(basePath)}><ArrowLeft size={16} /> Danh sách lớp</Button>
            {canManage && <Button variant="secondary" onClick={() => setShowEdit(true)}><Pencil size={15} /> Sửa lớp</Button>}
            {canManage && <Button variant="danger" onClick={deleteClass}><Trash2 size={15} /> Xóa lớp</Button>}
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <small className="block text-slate-500 mb-1">Mã tham gia lớp</small>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-extrabold tracking-widest text-primary">{cls.classCode || '••••••'}</code>
              {cls.classCode && <Button variant="ghost" onClick={copyCode} aria-label="Sao chép mã lớp"><Copy size={15} /></Button>}
              {canManageMembers && <Button variant="ghost" onClick={regenerateCode}><RefreshCw size={15} /> Đổi mã</Button>}
            </div>
          </div>
          <div>
            <small className="block text-slate-500 mb-1">Trạng thái</small>
            <Badge tone={statusTone}>{statusLabel}</Badge>
          </div>
          <div>
            <small className="block text-slate-500 mb-1">Sĩ số</small>
            <b className="text-lg">{cls.totalStudents} học viên</b>
          </div>
        </div>
        {cls.status !== 'active' && (
          <p className="mt-3 text-sm text-amber-700">Lớp đang {statusLabel.toLowerCase()} nên học viên không thể tự tham gia bằng mã.</p>
        )}
      </Card>

      <div className="tabs-card flex-wrap">
        <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Học viên</button>
        <button className={`tab ${tab === 'progress' ? 'active' : ''}`} onClick={() => setTab('progress')}>Tiến độ học tập</button>
        <button className={`tab ${tab === 'quizzes' ? 'active' : ''}`} onClick={() => setTab('quizzes')}>Bài kiểm tra</button>
        <button className={`tab ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>Bài tập</button>
        <button className={`tab ${tab === 'gradebook' ? 'active' : ''}`} onClick={() => setTab('gradebook')}>Bảng điểm</button>
      </div>

      {tab === 'members' && <MembersTab cls={cls} canManageMembers={canManageMembers} onChanged={load} />}
      {tab === 'progress' && <ProgressTab cls={cls} />}
      {tab === 'quizzes' && <ClassQuizzesTab cls={cls} role={role} />}
      {tab === 'assignments' && <ClassAssignmentsTab cls={cls} role={role} />}
      {tab === 'gradebook' && <ClassGradebook cls={cls} />}

      {showEdit && (
        <ClassFormModal
          cls={cls}
          role={role}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}
    </>
  );
}
