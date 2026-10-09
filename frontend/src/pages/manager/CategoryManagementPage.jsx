import React, { useEffect, useState } from 'react';
import { FolderTree, MoreHorizontal, Plus, Save, Trash2 } from 'lucide-react';
import { PortalHeader, Button, Card, SectionTitle, Badge, Field } from '../../components/portal/PortalUI';
import { categoryService } from '../../services/categoryService';

const emptyForm = { name: '', description: '', sortOrder: 0, isActive: true };

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadCategories = async (selectId = selectedId) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const list = await categoryService.getCategories({ includeInactive: true });
      setCategories(list);
      const selected = list.find((category) => category.id === selectId);
      if (selected) {
        setSelectedId(selected.id);
        setForm({
          name: selected.name,
          description: selected.description || '',
          sortOrder: selected.sortOrder,
          isActive: selected.isActive
        });
      } else if (selectId) {
        setSelectedId(null);
        setForm(emptyForm);
      }
    } catch (error) {
      console.error('Load categories failed:', error);
      setErrorMessage(error?.message || 'Không thể tải danh mục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(null);
  }, []);

  const selectCategory = (category) => {
    setSelectedId(category.id);
    setForm({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive
    });
  };

  const startNewCategory = () => {
    setSelectedId(null);
    setForm(emptyForm);
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (form.name.trim().length < 2) {
      setErrorMessage('Tên danh mục cần có ít nhất 2 ký tự.');
      return;
    }
    try {
      setSaving(true);
      setErrorMessage('');
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim()
      };
      const saved = selectedId
        ? await categoryService.updateCategory(selectedId, payload)
        : await categoryService.createCategory(payload);
      await loadCategories(saved.id);
    } catch (error) {
      console.error('Save category failed:', error);
      setErrorMessage(error?.message || 'Không thể lưu danh mục.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      setSaving(true);
      setErrorMessage('');
      await categoryService.deleteCategory(selectedId);
      startNewCategory();
      await loadCategories(null);
    } catch (error) {
      console.error('Delete category failed:', error);
      setErrorMessage(error?.message || 'Không thể xóa danh mục.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PortalHeader
        eyebrow="CATALOG"
        title="Quản lý danh mục"
        desc="Tạo, chỉnh sửa và sắp xếp danh mục khóa học."
        actions={<Button onClick={startNewCategory}><Plus size={17} /> Thêm danh mục</Button>}
      />

      {errorMessage && <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c' }}>{errorMessage}</div>}

      <div className="category-layout">
        <Card>
          <SectionTitle title="Danh mục" />
          {loading ? (
            <div style={{ padding: '1rem', color: '#64748b' }}>Đang tải danh mục...</div>
          ) : categories.length === 0 ? (
            <div style={{ padding: '1rem', color: '#64748b' }}>Chưa có danh mục nào.</div>
          ) : categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="category-row"
              onClick={() => selectCategory(category)}
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <div>
                <FolderTree size={18} />
                <b>{category.name}</b>
                <small>{category.courseCount} khóa học</small>
              </div>
              <Badge tone={category.isActive ? 'green' : 'gray'}>{category.isActive ? 'Hiển thị' : 'Đã ẩn'}</Badge>
              <MoreHorizontal />
            </button>
          ))}
        </Card>

        <Card>
          <SectionTitle title={selectedId ? 'Chỉnh sửa danh mục' : 'Tạo danh mục'} />
          <Field
            label="Tên danh mục"
            placeholder="VD: Lập trình"
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
          />
          <Field label="Slug" value={categories.find((category) => category.id === selectedId)?.slug || 'Tự tạo từ tên danh mục'} readOnly />
          <Field
            label="Mô tả"
            placeholder="Mô tả ngắn về danh mục..."
            value={form.description}
            onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
          />
          <Field
            label="Thứ tự hiển thị"
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(event) => setForm((previous) => ({ ...previous, sortOrder: Number(event.target.value) }))}
          />
          <label className="switch-row">
            <span><b>Hiển thị</b><small>Cho phép học viên thấy danh mục</small></span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((previous) => ({ ...previous, isActive: event.target.checked }))}
            />
          </label>
          <div className="modal-actions">
            {selectedId && <Button variant="danger" onClick={handleDelete} disabled={saving}><Trash2 size={16} /> Xóa</Button>}
            <Button onClick={handleSave} disabled={saving}><Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu danh mục'}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
