import React, { useMemo, useState } from 'react';
import { Lightbulb, ListChecks, Plus, Save, Trash2 } from 'lucide-react';
import { Button, Card, SectionTitle } from '../portal/PortalUI';
import courseService, { COURSE_LEVEL } from '../../services/courseService';
import { toast } from '../common/Toast';

const SHORT_MAX = 160;
const ITEM_MAX = 160;
const LIST_MAX = 10;

const toForm = (course) => ({
  shortDescription: course?.shortDescription || '',
  level: course?.level || '',
  learningOutcomes: course?.learningOutcomes?.length ? course.learningOutcomes : [''],
  requirements: course?.requirements?.length ? course.requirements : ['']
});

// Gửi lên: bỏ dòng trống, chuỗi rỗng -> null (khớp courseValidation.js)
const toPayload = (form) => ({
  shortDescription: form.shortDescription.trim() || null,
  level: form.level || null,
  learningOutcomes: form.learningOutcomes.map((item) => item.trim()).filter(Boolean),
  requirements: form.requirements.map((item) => item.trim()).filter(Boolean)
});

/** Danh sách dòng nhập (Bạn sẽ học được gì, Yêu cầu đầu vào): tối đa 10 dòng, mỗi dòng 160 ký tự */
function ListEditor({ label, hint, placeholder, items, onChange, readOnly }) {
  const update = (index, value) => onChange(items.map((item, i) => (i === index ? value : item)));
  const remove = (index) => onChange(items.length > 1 ? items.filter((_, i) => i !== index) : ['']);
  return (
    <div>
      <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
      <small className="mb-2 block text-xs text-slate-500">{hint}</small>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-5 flex-none text-right text-xs font-semibold text-slate-500">{index + 1}.</span>
            <input
              value={item}
              maxLength={ITEM_MAX}
              readOnly={readOnly}
              onChange={(e) => update(index, e.target.value)}
              placeholder={placeholder}
              aria-label={`${label} — dòng ${index + 1}`}
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1168bd] read-only:bg-slate-50"
            />
            {!readOnly && (
              <button type="button" onClick={() => remove(index)} className="p-1.5 text-slate-500 hover:text-red-600" aria-label={`Xóa dòng ${index + 1}`}>
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && items.length < LIST_MAX && (
        <Button type="button" variant="ghost" onClick={() => onChange([...items, ''])}><Plus size={15} /> Thêm dòng</Button>
      )}
    </div>
  );
}

/**
 * Tab "Trang giới thiệu" trong trang soạn đề cương: mô tả ngắn, trình độ, Bạn sẽ học được gì, Yêu cầu đầu vào.
 * Khóa đang chờ duyệt / đã công khai: chỉ xem (backend cũng chặn sửa, 409).
 */
export default function CourseLandingEditor({ course, locked, onSaved }) {
  const [form, setForm] = useState(() => toForm(course));
  const [saving, setSaving] = useState(false);
  const initial = useMemo(() => JSON.stringify(toPayload(toForm(course))), [course]);
  const dirty = JSON.stringify(toPayload(form)) !== initial;
  const outcomeCount = form.learningOutcomes.filter((item) => item.trim()).length;

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    try {
      setSaving(true);
      await courseService.update(course.id, toPayload(form));
      toast.success('Đã lưu trang giới thiệu khóa học.');
      onSaved?.();
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'Không thể lưu trang giới thiệu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <SectionTitle
        title="Trang giới thiệu khóa học"
        action={!locked && <Button onClick={save} disabled={!dirty || saving}><Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu trang giới thiệu'}</Button>}
      />
      <p className="mt-0 mb-5 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        <Lightbulb size={15} className="mt-0.5 flex-none text-amber-600" />
        Các thông tin này hiện trên trang chi tiết khóa học, giúp học viên quyết định có tham gia hay không. Tên, mô tả chi tiết, danh mục và ảnh bìa sửa ở nút "Sửa thông tin" tại trang Khóa học.
      </p>

      <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
        <label className="field !mb-0">
          <span>Mô tả ngắn ({form.shortDescription.length}/{SHORT_MAX})</span>
          <input
            value={form.shortDescription}
            maxLength={SHORT_MAX}
            readOnly={locked}
            onChange={(e) => set('shortDescription')(e.target.value)}
            placeholder="Một câu tóm tắt khóa học, hiện trên thẻ khóa học và kết quả tìm kiếm"
          />
        </label>
        <label className="field !mb-0">
          <span>Trình độ</span>
          <select value={form.level} disabled={locked} onChange={(e) => set('level')(e.target.value)}>
            <option value="">— Chưa chọn —</option>
            {Object.entries(COURSE_LEVEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ListEditor
          label="Bạn sẽ học được gì"
          hint={`Kết quả học viên đạt được sau khóa học. Nên có ít nhất 4 dòng (hiện có ${outcomeCount}).`}
          placeholder="VD: Thiết kế lớp và đối tượng theo nguyên lý đóng gói"
          items={form.learningOutcomes}
          onChange={set('learningOutcomes')}
          readOnly={locked}
        />
        <ListEditor
          label="Yêu cầu đầu vào"
          hint="Kiến thức, công cụ học viên cần có trước. Để trống nếu không yêu cầu gì."
          placeholder="VD: Đã biết biến, vòng lặp và hàm"
          items={form.requirements}
          onChange={set('requirements')}
          readOnly={locked}
        />
      </div>

      {!locked && outcomeCount > 0 && outcomeCount < 4 && (
        <p className="mt-4 mb-0 flex items-center gap-1.5 text-xs text-amber-700"><ListChecks size={14} /> Gợi ý: thêm vài dòng "Bạn sẽ học được gì" để trang khóa học thuyết phục hơn.</p>
      )}
    </Card>
  );
}
