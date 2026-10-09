import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, FolderTree, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { PortalHeader, Button, Card, SectionTitle, Badge, Field } from '../../components/portal/PortalUI';
import categoryService from '../../services/categoryService';
import { toast } from '../../components/common/Toast';

const EMPTY_FORM = { name: '', description: '', isActive: true };

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null); // null = đang tạo mới
  const [form, setForm] = useState(EMPTY_FORM);

  const selected = useMemo(() => categories.find(c => c.id === selectedId) || null, [categories, selectedId]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await categoryService.list({ includeHidden: true });
      setCategories(data || []);
    } catch (error) {
      toast.error(error?.message || 'Không thể tải danh mục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (category) => {
    setSelectedId(category.id);
    setForm({ name: category.name, description: category.description || '', isActive: category.isActive });
  };

  const save = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Tên danh mục phải có ít nhất 2 ký tự.');
      return;
    }

    const payload = { name: form.name.trim(), description: form.description.trim(), isActive: form.isActive };
    try {
      setSaving(true);
      if (selected) {
        const updated = await categoryService.update(selected.id, payload);
        setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        toast.success('Đã lưu danh mục.');
      } else {
        const created = await categoryService.create(payload);
        setCategories(prev => [...prev, created]);
        setSelectedId(created.id);
        toast.success('Đã tạo danh mục.');
      }
    } catch (error) {
      toast.error(error?.message || 'Không thể lưu danh mục.');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (category) => {
    try {
      const updated = await categoryService.update(category.id, { isActive: !category.isActive });
      setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      if (selectedId === updated.id) setForm(f => ({ ...f, isActive: updated.isActive }));
      toast.success(updated.isActive ? 'Đã hiển thị danh mục.' : 'Đã ẩn danh mục.');
    } catch (error) {
      toast.error(error?.message || 'Không thể cập nhật trạng thái.');
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;

    const previous = categories;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
    try {
      await categoryService.reorder(next.map(c => c.id));
    } catch (error) {
      setCategories(previous);
      toast.error(error?.message || 'Không thể sắp xếp danh mục.');
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!window.confirm(`Xóa danh mục "${selected.name}"?`)) return;
    try {
      await categoryService.remove(selected.id);
      setCategories(prev => prev.filter(c => c.id !== selected.id));
      startCreate();
      toast.success('Đã xóa danh mục.');
    } catch (error) {
      // 409 khi còn khóa học dùng danh mục -> thông báo gợi ý ẩn thay vì xóa
      toast.error(error?.message || 'Không thể xóa danh mục.');
    }
  };

  return (
    <>
      <PortalHeader
        eyebrow="CATALOG"
        title="Quản lý danh mục"
        desc="Tạo, chỉnh sửa, ẩn/hiện và sắp xếp danh mục khóa học."
        actions={
          <>
            <Button variant="secondary" onClick={load} disabled={loading}>
              <RefreshCw size={16} /> Làm mới
            </Button>
            <Button onClick={startCreate}>
              <Plus size={17} /> Thêm danh mục
            </Button>
          </>
        }
      />

      <div className="category-layout">
        <Card>
          <SectionTitle title={`Danh mục (${categories.length})`} />
          {loading ? (
            <div className="p-8 text-center text-slate-500">Đang tải danh mục...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Chưa có danh mục nào.</div>
          ) : (
            categories.map((category, index) => (
              <div
                className={`category-row cursor-pointer ${selectedId === category.id ? 'bg-slate-50' : ''}`}
                key={category.id}
                onClick={() => startEdit(category)}
              >
                <div>
                  <FolderTree size={18} />
                  <b>{category.name}</b>
                  <small>{category.courseCount} khóa học</small>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); toggleVisibility(category); }}
                  title="Bấm để ẩn/hiện"
                >
                  <Badge tone={category.isActive ? 'green' : 'gray'}>{category.isActive ? 'Hiển thị' : 'Đang ẩn'}</Badge>
                </button>
                <div className="flex gap-1" style={{ flex: 'none' }}>
                  <Button
                    variant="ghost"
                    type="button"
                    disabled={index === 0}
                    onClick={e => { e.stopPropagation(); move(index, -1); }}
                    title="Lên"
                  >
                    <ArrowUp size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    disabled={index === categories.length - 1}
                    onClick={e => { e.stopPropagation(); move(index, 1); }}
                    title="Xuống"
                  >
                    <ArrowDown size={15} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card>
          <form onSubmit={save}>
            <SectionTitle title={selected ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'} />
            <Field
              label="Tên danh mục *"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Lập trình"
            />
            {selected && <Field label="Slug (tự sinh từ tên)" value={selected.slug} readOnly disabled />}
            <Field label="Mô tả">
              <textarea
                rows="3"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về nhóm khóa học..."
              />
            </Field>
            <div className="switch-row">
              <div>
                <b>Hiển thị</b>
                <small>Cho phép học viên và giảng viên thấy danh mục</small>
              </div>
              <button
                type="button"
                className={`switch ${form.isActive ? 'on' : ''}`}
                style={{ border: 0, padding: 0, cursor: 'pointer' }}
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                aria-label="Bật/tắt hiển thị"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              {selected ? (
                <Button type="button" variant="danger" onClick={remove}>
                  <Trash2 size={15} /> Xóa
                </Button>
              ) : <span />}
              <Button type="submit" disabled={saving}>
                <Save size={16} /> {saving ? 'Đang lưu...' : selected ? 'Lưu thay đổi' : 'Tạo danh mục'}
              </Button>
            </div>
            {selected?.courseCount > 0 && (
              <p className="text-xs text-slate-500 mt-3">
                Danh mục đang có {selected.courseCount} khóa học nên không thể xóa — hãy ẩn danh mục nếu không muốn dùng nữa.
              </p>
            )}
          </form>
        </Card>
      </div>
    </>
  );
}
