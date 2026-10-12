import React, { useEffect, useMemo, useState } from 'react';
import { Button, Field } from '../portal/PortalUI';
import courseService from '../../services/courseService';
import classService, { CLASS_STATUS } from '../../services/classService';
import { toast } from '../common/Toast';

const toForm = (cls) => ({
  courseId: '',
  teacherId: '',
  name: cls?.name || '',
  classCode: '',
  startDate: cls?.startDate || '',
  endDate: cls?.endDate || '',
  status: cls?.status || 'active'
});

/**
 * Form mở lớp mới / sửa lớp (api-classes.md).
 * - Tạo: chọn khóa học đã published; Quản lý/Admin chọn thêm giảng viên phụ trách (mặc định chủ khóa học).
 * - Sửa: tên, ngày bắt đầu/kết thúc, trạng thái.
 */
export default function ClassFormModal({ cls = null, role, defaultCourseId = '', onClose, onSaved }) {
  const isEdit = Boolean(cls);
  const isStaff = role === 'training_manager' || role === 'admin';
  const [form, setForm] = useState(() => ({ ...toForm(cls), courseId: defaultCourseId }));
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) return;
    courseService.list({ status: 'published', limit: 100 })
      .then(data => setCourses(data.items || []))
      .catch(error => toast.error(error?.message || 'Không thể tải danh sách khóa học.'));
  }, [isEdit]);

  // Giảng viên có thể chọn: chủ của các khóa học đã published (API /users chỉ dành cho Admin)
  const teacherOptions = useMemo(() => {
    const map = new Map();
    courses.forEach(course => course.owner && map.set(course.owner.id, course.owner));
    return [...map.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
  }, [courses]);

  const selectedCourse = courses.find(course => course.id === form.courseId);
  const set = (key) => (event) => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!isEdit && !form.courseId) {
      toast.error('Vui lòng chọn khóa học.');
      return;
    }
    if (form.name.trim().length < 5) {
      toast.error('Tên lớp học phải có ít nhất 5 ký tự.');
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast.error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await classService.update(cls.id, {
          name: form.name.trim(),
          status: form.status,
          startDate: form.startDate || null,
          endDate: form.endDate || null
        });
        toast.success('Đã cập nhật lớp học.');
        onSaved?.();
      } else {
        const created = await classService.create({
          courseId: form.courseId,
          name: form.name.trim(),
          ...(form.classCode.trim() ? { classCode: form.classCode.trim() } : {}),
          ...(isStaff && form.teacherId ? { teacherId: form.teacherId } : {}),
          ...(form.startDate ? { startDate: form.startDate } : {}),
          ...(form.endDate ? { endDate: form.endDate } : {})
        });
        toast.success(`Đã mở lớp. Mã tham gia: ${created.classCode}`);
        onSaved?.(created);
      }
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'Không thể lưu lớp học.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal space-y-3" onSubmit={submit}>
        <div className="modal-head">
          <h2>{isEdit ? 'Sửa thông tin lớp học' : 'Mở lớp học mới'}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        {!isEdit && (
          <Field label="Khóa học (đã công khai)">
            <select value={form.courseId} onChange={set('courseId')}>
              <option value="">— Chọn khóa học —</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}{course.owner ? ` · ${course.owner.fullName}` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}

        {!isEdit && isStaff && (
          <Field label="Giảng viên phụ trách">
            <select value={form.teacherId} onChange={set('teacherId')}>
              <option value="">
                {selectedCourse?.owner ? `Mặc định: chủ khóa học (${selectedCourse.owner.fullName})` : 'Mặc định: chủ khóa học'}
              </option>
              {teacherOptions.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.fullName} · {teacher.email}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Tên lớp học" value={form.name} onChange={set('name')} placeholder="VD: React Web — Nhóm A01 (K2026)" />

        {!isEdit && (
          <Field
            label="Mã tham gia (tùy chọn)"
            value={form.classCode}
            onChange={e => setForm(prev => ({ ...prev, classCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
            placeholder="Để trống để hệ thống tự sinh 6 ký tự"
            maxLength={20}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Ngày bắt đầu" type="date" value={form.startDate || ''} onChange={set('startDate')} />
          <Field label="Ngày kết thúc" type="date" value={form.endDate || ''} onChange={set('endDate')} />
        </div>

        {isEdit && (
          <Field label="Trạng thái">
            <select value={form.status} onChange={set('status')}>
              {Object.entries(CLASS_STATUS).map(([value, [label]]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
        )}
        {isEdit && form.status !== 'active' && (
          <p className="text-xs text-amber-700">Lớp không ở trạng thái "Đang hoạt động" sẽ không nhận học viên tham gia bằng mã.</p>
        )}

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Mở lớp'}</Button>
        </div>
      </form>
    </div>
  );
}
