import React, { useEffect, useState } from 'react';
import { FileText, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { PortalHeader, Button, Card, Table, Badge } from '../../components/portal/PortalUI';
import AssignmentFormModal from '../../components/assignment/AssignmentFormModal';
import assignmentService from '../../services/assignmentService';
import { toast } from '../../components/common/Toast';

const COURSE_STATUS = { draft: ['Nháp', 'gray'], rejected: ['Bị từ chối', 'red'], pending: ['Chờ duyệt', 'orange'], published: ['Đã công khai', 'green'] };
const isEditable = (assignment) => ['draft', 'rejected'].includes(assignment.course?.status);

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | assignment

  const load = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.list({ limit: 100 });
      setAssignments(data.items || []);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải bài tập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = async (assignment) => {
    try {
      setModal(await assignmentService.get(assignment.id)); // cần instruction đầy đủ
    } catch (error) {
      toast.error(error?.message || 'Không thể tải bài tập.');
    }
  };

  const remove = async (assignment) => {
    if (!window.confirm(`Xóa bài tập "${assignment.title}"?`)) return;
    try {
      await assignmentService.remove(assignment.id);
      toast.success('Đã xóa bài tập.');
      load();
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa bài tập.');
    }
  };

  const keyword = search.trim().toLowerCase();
  const visible = assignments.filter(a => !keyword || a.title.toLowerCase().includes(keyword) || a.course?.title?.toLowerCase().includes(keyword));

  return (
    <>
      <PortalHeader
        eyebrow="ASSIGNMENTS"
        title="Bài tập"
        desc="Soạn đề bài tập nộp file cho các bài học loại Bài tập. Giao bài, đặt hạn nộp và chấm điểm trong trang Lớp học."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} /> Làm mới</Button>
            <Button onClick={() => setModal('create')}><Plus size={17} /> Tạo bài tập</Button>
          </>
        }
      />

      <div className="filter-bar">
        <span className="text-sm text-slate-500">{assignments.length} bài tập</span>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 w-full md:w-64">
          <Search size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên bài tập, khóa học..." className="flex-1 min-w-0 text-sm outline-none" />
        </label>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải bài tập...</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="text-slate-500">{assignments.length ? 'Không có bài tập phù hợp.' : 'Chưa có bài tập nào. Thêm bài học loại "Bài tập" trong đề cương rồi bấm "Tạo bài tập".'}</p>
          </div>
        ) : (
          <Table
            headers={['Bài tập', 'Khóa học', 'Định dạng', 'Tối đa', '']}
            rows={visible.map(assignment => {
              const [label, tone] = COURSE_STATUS[assignment.course?.status] || ['', 'gray'];
              return [
                <div><b>{assignment.title}</b><div className="text-xs text-slate-500">{assignment.lessonTitle}</div></div>,
                <div>{assignment.course?.title}<div><Badge tone={tone}>{label}</Badge></div></div>,
                <code className="text-xs">{assignment.allowedFileTypes}</code>,
                `${assignment.maxFileSizeMb} MB`,
                isEditable(assignment) ? (
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => openEdit(assignment)} aria-label={`Sửa ${assignment.title}`}><Pencil size={15} /></Button>
                    <Button variant="ghost" onClick={() => remove(assignment)} aria-label={`Xóa ${assignment.title}`}><Trash2 size={15} /></Button>
                  </div>
                ) : <small className="text-slate-400">Chỉ xem</small>
              ];
            })}
          />
        )}
      </Card>

      {modal && (
        <AssignmentFormModal
          assignment={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </>
  );
}
