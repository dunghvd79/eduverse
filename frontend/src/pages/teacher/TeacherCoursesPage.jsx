import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, MoreHorizontal, ExternalLink, Sparkles } from 'lucide-react';
import { PortalHeader, Button, Card, Table, Badge, Field } from '../../components/portal/PortalUI';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';

const tabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'rejected', label: 'Từ chối' }
];

const statusTone = {
  draft: 'gray',
  pending: 'orange',
  published: 'green',
  rejected: 'red'
};

const statusLabel = {
  draft: 'Draft',
  pending: 'Chờ duyệt',
  published: 'Published',
  rejected: 'Từ chối'
};

export default function TeacherCoursesPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({ title: '', description: '', price: '0', categoryId: '' });

  const loadCourses = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await courseService.getMyCourses({ limit: 100 });
      const items = res?.items || [];
      setCourses(items);
    } catch (error) {
      console.error('Load courses failed:', error);
      setCourses([]);
      setErrorMessage(error?.message || 'Không thể tải danh sách khóa học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    categoryService.getCategories()
      .then(setCategories)
      .catch((error) => {
        console.error('Load categories failed:', error);
        setErrorMessage(error?.message || 'Không thể tải danh mục khóa học.');
      });
  }, []);

  const visibleCourses = useMemo(() => {
    if (activeTab === 'all') return courses;
    return courses.filter((course) => course.status === activeTab);
  }, [courses, activeTab]);

  const counts = useMemo(() => ({
    all: courses.length,
    published: courses.filter((course) => course.status === 'published').length,
    draft: courses.filter((course) => course.status === 'draft').length,
    pending: courses.filter((course) => course.status === 'pending').length,
    rejected: courses.filter((course) => course.status === 'rejected').length
  }), [courses]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price || 0),
        categoryId: form.categoryId || null
      };
      const created = await courseService.createCourse(payload);
      setShow(false);
      setForm({ title: '', description: '', price: '0', categoryId: '' });
      navigate(`/teacher/courses/${created.id}/curriculum`);
    } catch (error) {
      console.error('Create course failed:', error);
      setErrorMessage(error?.message || 'Không thể tạo khóa học.');
    }
  };

  return (
    <>
      <PortalHeader
        eyebrow="COURSE MANAGEMENT"
        title="Khóa học của tôi"
        desc="Tạo, chỉnh sửa và gửi khóa học tới bộ phận đào tạo duyệt."
        actions={<Button onClick={() => setShow(true)}><Plus size={17} /> Tạo khóa mới</Button>}
      />

      <div className="filter-bar">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} {tab.key === 'all' ? counts.all : counts[tab.key]}
            </button>
          ))}
        </div>
        <Button variant="secondary"><Filter size={16} /> Bộ lọc</Button>
      </div>

      {errorMessage && <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c' }}>{errorMessage}</div>}
      <Card>
        {loading ? (
          <div style={{ padding: '1.5rem', color: '#475569' }}>Đang tải khóa học...</div>
        ) : errorMessage ? null : visibleCourses.length === 0 ? (
          <div style={{ padding: '1.5rem', color: '#475569' }}>Chưa có khóa học nào phù hợp với bộ lọc hiện tại.</div>
        ) : (
          <Table
            headers={['Khóa học', 'Trạng thái', 'Số bài học', 'Cập nhật', '']}
            rows={visibleCourses.map((course) => [
              <div className="table-course" key={course.id}>
                <div className="tiny-cover">{course.title?.slice(0, 2).toUpperCase() || 'CO'}</div>
                <div>
                  <b>{course.title}</b>
                  <small style={{ display: 'block', color: '#64748b' }}>
                    {course.category?.name ? `${course.category.name} · ` : ''}{course.owner?.fullName || 'Bạn'}
                  </small>
                </div>
              </div>,
              <Badge tone={statusTone[course.status] || 'gray'}>{statusLabel[course.status] || course.status}</Badge>,
              <span>{course.totalLessons ?? 0}</span>,
              <span>{course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('vi-VN') : '—'}</span>,
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" className="ui-btn ghost" onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`)}>
                  <ExternalLink size={14} />
                </button>
                <MoreHorizontal size={16} />
              </div>
            ])}
          />
        )}
      </Card>

      {show && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h2>Tạo khóa học mới</h2>
              <button type="button" onClick={() => setShow(false)}>×</button>
            </div>
            <Field
              label="Tên khóa học"
              placeholder="VD: React Web thực chiến"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Field
              label="Mô tả ngắn"
              placeholder="Mô tả mục tiêu khóa học..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <Field
              label="Học phí"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            />
            <label className="field">
              <span>Danh mục</span>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                <option value="">Chưa phân loại</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShow(false)}>Hủy</Button>
              <Button onClick={handleCreate}>Tạo khóa học</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
