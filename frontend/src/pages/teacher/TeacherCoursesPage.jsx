import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, RefreshCw, Send, Trash2, Edit3, BookOpen, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader, Button, Card, Table, Badge, Field } from '../../components/portal/PortalUI';
import courseService from '../../services/courseService';
import categoryService from '../../services/categoryService';
import { toast } from '../../components/common/Toast';

const EMPTY_FORM = { title: '', description: '', price: '0', categoryId: '' };
const isEditable = (course) => course.status === 'draft' || course.status === 'rejected';

const STATUS_LABEL = {
  published: ['Published', 'green'],
  draft: ['Draft', 'gray'],
  pending: ['Chờ duyệt', 'orange'],
  rejected: ['Từ chối', 'red']
};

export default function TeacherCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null); // null = tạo mới
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Lấy toàn bộ khóa của chính giảng viên (mine=true), lọc trạng thái phía client để số đếm trên tab luôn đúng
  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.list({ limit: 100, mine: true });
      setCourses(data.items || []);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải danh sách khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    categoryService.list()
      .then(data => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  const counts = useMemo(() => ({
    all: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    pending: courses.filter(c => c.status === 'pending').length,
    rejected: courses.filter(c => c.status === 'rejected').length
  }), [courses]);

  const visibleCourses = useMemo(
    () => (status ? courses.filter(c => c.status === status) : courses),
    [courses, status]
  );

  const openCreate = () => {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setForm({
      title: course.title || '',
      description: course.description || '',
      price: String(Number(course.price) || 0),
      categoryId: course.category?.id || ''
    });
    setShowForm(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (form.title.trim().length < 5) {
      toast.error('Tên khóa học phải có ít nhất 5 ký tự.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        categoryId: form.categoryId || null
      };

      if (editingCourse) {
        await courseService.update(editingCourse.id, payload);
        toast.success('Đã cập nhật thông tin khóa học.');
        setShowForm(false);
        await loadCourses();
        return;
      }

      const data = await courseService.create(payload);
      toast.success('Tạo khóa học thành công.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadCourses();
      navigate(`/teacher/courses/${data.id}/curriculum`);
    } catch (error) {
      toast.error(error?.message || (editingCourse ? 'Không thể cập nhật khóa học.' : 'Không thể tạo khóa học.'));
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
            <Button onClick={openCreate}>
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
            ['pending', `Chờ duyệt ${counts.pending}`],
            ['rejected', `Từ chối ${counts.rejected}`]
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
        ) : visibleCourses.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="text-slate-500">Chưa có khóa học phù hợp.</p>
          </div>
        ) : (
          <Table
            headers={['Khóa học', 'Danh mục', 'Bài học', 'Cập nhật', 'Trạng thái', 'Thao tác']}
            rows={visibleCourses.map(course => {
              const [label, tone] = STATUS_LABEL[course.status] || [course.status, 'gray'];
              return [
                <div>
                  <b>{course.title}</b>
                  {course.rejectionReason && (
                    <div className="text-xs text-red-600 mt-1">Lý do: {course.rejectionReason}</div>
                  )}
                </div>,
                course.category?.name || <span className="text-slate-400">Chưa chọn</span>,
                course.totalLessons ?? 0,
                course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('vi-VN') : '—',
                <Badge tone={tone}>{label}</Badge>,
                <div className="flex gap-1.5">
                  <Button variant="ghost" onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`)}>
                    <Edit3 size={15} /> {isEditable(course) ? 'Soạn' : 'Xem'}
                  </Button>
                  {isEditable(course) && (
                    <>
                      <Button variant="ghost" onClick={() => openEdit(course)} title="Sửa thông tin khóa học">
                        <Settings2 size={15} />
                      </Button>
                      <Button variant="ghost" onClick={() => requestApproval(course)}>
                        <Send size={15} /> Gửi duyệt
                      </Button>
                      <Button variant="ghost" onClick={() => deleteCourse(course)} title="Xóa khóa học">
                        <Trash2 size={15} />
                      </Button>
                    </>
                  )}
                </div>
              ];
            })}
          />
        )}
      </Card>

      {showForm && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submitForm}>
            <div className="modal-head">
              <h2>{editingCourse ? 'Sửa thông tin khóa học' : 'Tạo khóa học mới'}</h2>
              <button type="button" onClick={() => setShowForm(false)}>×</button>
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
            <Field label="Danh mục">
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">— Chưa chọn danh mục —</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                {/* Danh mục cũ đã bị ẩn vẫn hiển thị để không mất lựa chọn hiện tại */}
                {editingCourse?.category && !categories.some(c => c.id === editingCourse.category.id) && (
                  <option value={editingCourse.category.id}>{editingCourse.category.name} (đang ẩn)</option>
                )}
              </select>
            </Field>
            <Field
              label="Học phí"
              type="number"
              min="0"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
            />

            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : editingCourse ? 'Lưu thay đổi' : 'Tạo khóa học'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
