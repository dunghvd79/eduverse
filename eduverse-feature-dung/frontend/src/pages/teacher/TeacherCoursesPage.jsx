import React, { useEffect, useMemo, useState } from 'react';
import { Filter, MoreHorizontal, Plus, RefreshCw, Send, Trash2, Edit3, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader, Button, Card, Table, Badge, Field } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import { toast } from '../../components/common/Toast';

const STATUS_LABEL = {
  published: ['Published', 'green'],
  draft: ['Draft', 'gray'],
  pending: ['Chờ duyệt', 'orange'],
  rejected: ['Từ chối', 'red']
};

export default function TeacherCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '0' });

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.list({ limit: 100, ...(status ? { status } : {}) });
      setCourses(data.items || []);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải danh sách khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [status]);

  const counts = useMemo(() => ({
    all: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    pending: courses.filter(c => c.status === 'pending').length
  }), [courses]);

  const createCourse = async (event) => {
    event.preventDefault();
    if (form.title.trim().length < 5) {
      toast.error('Tên khóa học phải có ít nhất 5 ký tự.');
      return;
    }

    try {
      setSaving(true);
      const data = await courseService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0
      });

      toast.success('Tạo khóa học thành công.');
      setShowCreate(false);
      setForm({ title: '', description: '', price: '0' });
      await loadCourses();
      navigate(`/teacher/courses/${data.id}/curriculum`);
    } catch (error) {
      toast.error(error?.message || 'Không thể tạo khóa học.');
    } finally {
      setSaving(false);
    }
  };

  const requestApproval = async (course) => {
    try {
      await courseService.requestApproval(course.id);
      toast.success('Đã gửi khóa học tới quản lý đào tạo.');
      loadCourses();
    } catch (error) {
      toast.error(error?.message || 'Không thể gửi duyệt.');
    }
  };

  const deleteCourse = async (course) => {
    if (!window.confirm(`Xóa khóa học "${course.title}"?`)) return;
    try {
      await courseService.remove(course.id);
      toast.success('Đã xóa khóa học.');
      loadCourses();
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa khóa học.');
    }
  };

  return (
    <>
      <PortalHeader
        eyebrow="COURSE MANAGEMENT"
        title="Khóa học của tôi"
        desc="Tạo, chỉnh sửa đề cương và gửi khóa học tới bộ phận đào tạo duyệt."
        actions={
          <>
            <Button variant="secondary" onClick={loadCourses} disabled={loading}>
              <RefreshCw size={16} /> Làm mới
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={17} /> Tạo khóa mới
            </Button>
          </>
        }
      />

      <div className="filter-bar">
        <div className="tabs">
          {[
            ['', `Tất cả ${counts.all}`],
            ['published', `Published ${counts.published}`],
            ['draft', `Draft ${counts.draft}`],
            ['pending', `Chờ duyệt ${counts.pending}`]
          ].map(([value, label]) => (
            <button
              key={value || 'all'}
              className={`tab ${status === value ? 'active' : ''}`}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <Button variant="secondary"><Filter size={16}/> Bộ lọc</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải khóa học...</div>
        ) : courses.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="text-slate-500">Chưa có khóa học phù hợp.</p>
          </div>
        ) : (
          <Table
            headers={['Khóa học', 'Học viên', 'Bài học', 'Cập nhật', 'Trạng thái', 'Thao tác']}
            rows={courses.map(course => {
              const [label, tone] = STATUS_LABEL[course.status] || [course.status, 'gray'];
              return [
                <div>
                  <b>{course.title}</b>
                  {course.rejectionReason && (
                    <div className="text-xs text-red-600 mt-1">Lý do: {course.rejectionReason}</div>
                  )}
                </div>,
                course.totalStudents ?? '—',
                course.totalLessons ?? 0,
                course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('vi-VN') : '—',
                <Badge tone={tone}>{label}</Badge>,
                <div className="flex gap-1.5">
                  <Button variant="ghost" onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`)}>
                    <Edit3 size={15} /> Soạn
                  </Button>
                  {(course.status === 'draft' || course.status === 'rejected') && (
                    <Button variant="ghost" onClick={() => requestApproval(course)}>
                      <Send size={15} /> Gửi duyệt
                    </Button>
                  )}
                  {course.status !== 'published' && (
                    <Button variant="ghost" onClick={() => deleteCourse(course)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                  <MoreHorizontal size={18} className="mt-2 text-slate-400" />
                </div>
              ];
            })}
          />
        )}
      </Card>

      {showCreate && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createCourse}>
            <div className="modal-head">
              <h2>Tạo khóa học mới</h2>
              <button type="button" onClick={() => setShowCreate(false)}>×</button>
            </div>

            <Field
              label="Tên khóa học"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="VD: React Web thực chiến"
            />
            <Field
              label="Mô tả"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Mục tiêu và nội dung khóa học..."
            />
            <Field
              label="Học phí"
              type="number"
              min="0"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
            />

            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Đang tạo...' : 'Tạo khóa học'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
