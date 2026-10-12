import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Field } from '../portal/PortalUI';
import { QUESTION_TYPE } from '../../services/quizService';
import { toast } from '../common/Toast';

const LETTERS = 'ABCDEF';
const TRUE_FALSE = [{ content: 'Đúng', isCorrect: true }, { content: 'Sai', isCorrect: false }];
const EMPTY_CHOICES = [{ content: '', isCorrect: true }, { content: '', isCorrect: false }, { content: '', isCorrect: false }, { content: '', isCorrect: false }];

const toForm = (question) => ({
  content: question?.content || '',
  questionType: question?.questionType || 'single_choice',
  points: String(question?.points ?? 1),
  explanation: question?.explanation || '',
  choices: question?.choices?.length
    ? question.choices.map(({ id, content, isCorrect }) => ({ id, content, isCorrect: Boolean(isCorrect) }))
    : EMPTY_CHOICES
});

/**
 * Kiểm tra giống backend (quizService.validateChoices) để báo lỗi ngay trên form
 */
export const validateQuestion = ({ content, questionType, points, choices }) => {
  if (!content.trim()) return 'Vui lòng nhập nội dung câu hỏi.';
  if (!(Number(points) > 0)) return 'Điểm câu hỏi phải lớn hơn 0.';
  if (choices.length < 2 || choices.length > 6) return 'Câu hỏi phải có từ 2 đến 6 lựa chọn.';
  if (choices.some(c => !c.content.trim())) return 'Nội dung lựa chọn không được để trống.';
  const correct = choices.filter(c => c.isCorrect).length;
  if (correct === 0) return 'Phải có ít nhất một đáp án đúng.';
  if (questionType !== 'multiple_choice' && correct !== 1) return 'Câu hỏi một đáp án chỉ có đúng 1 đáp án đúng.';
  if (questionType === 'true_false' && choices.length !== 2) return 'Câu Đúng/Sai phải có đúng 2 lựa chọn.';
  return null;
};

/**
 * Form thêm / sửa 1 câu hỏi trắc nghiệm.
 * onSave(payload) nhận { content, questionType, points, explanation, choices[{id?, content, isCorrect}] }
 */
export default function QuestionEditorModal({ question = null, title, onSave, onClose }) {
  const [form, setForm] = useState(() => toForm(question));
  const [saving, setSaving] = useState(false);
  const isSingle = form.questionType !== 'multiple_choice';

  const changeType = (questionType) => {
    setForm(prev => {
      if (questionType === 'true_false') return { ...prev, questionType, choices: TRUE_FALSE };
      let choices = prev.questionType === 'true_false' ? EMPTY_CHOICES : prev.choices;
      // Đổi sang một đáp án: chỉ giữ lại đáp án đúng đầu tiên
      if (questionType === 'single_choice') {
        const first = Math.max(0, choices.findIndex(c => c.isCorrect));
        choices = choices.map((c, i) => ({ ...c, isCorrect: i === first }));
      }
      return { ...prev, questionType, choices };
    });
  };

  const setChoice = (index, patch) => setForm(prev => ({
    ...prev,
    choices: prev.choices.map((c, i) => (i === index ? { ...c, ...patch } : c))
  }));

  const toggleCorrect = (index) => setForm(prev => ({
    ...prev,
    choices: prev.choices.map((c, i) => (isSingle ? { ...c, isCorrect: i === index } : (i === index ? { ...c, isCorrect: !c.isCorrect } : c)))
  }));

  const removeChoice = (index) => setForm(prev => {
    const choices = prev.choices.filter((_, i) => i !== index);
    if (isSingle && choices.length && !choices.some(c => c.isCorrect)) choices[0] = { ...choices[0], isCorrect: true };
    return { ...prev, choices };
  });

  const submit = async (event) => {
    event.preventDefault();
    const error = validateQuestion(form);
    if (error) {
      toast.error(error);
      return;
    }
    try {
      setSaving(true);
      await onSave({
        content: form.content.trim(),
        questionType: form.questionType,
        points: Number(form.points),
        explanation: form.explanation.trim() || null,
        choices: form.choices.map(({ id, content, isCorrect }) => ({ ...(id ? { id } : {}), content: content.trim(), isCorrect }))
      });
    } catch (err) {
      toast.error(err?.errors?.[0] || err?.message || 'Không thể lưu câu hỏi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal space-y-3 max-h-[90vh] overflow-y-auto !w-[min(640px,100%)]" onSubmit={submit}>
        <div className="modal-head">
          <h2>{title || (question ? 'Sửa câu hỏi' : 'Thêm câu hỏi')}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <label className="field">
          <span>Nội dung câu hỏi</span>
          <textarea rows="3" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="VD: Hook nào dùng để quản lý state trong React?" autoFocus />
        </label>

        <div className="form-grid">
          <Field label="Loại câu hỏi">
            <select value={form.questionType} onChange={e => changeType(e.target.value)}>
              {Object.entries(QUESTION_TYPE).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Điểm" type="number" min="0.25" step="0.25" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} />
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-600 mb-2">
            Lựa chọn — bấm vào ô tròn/vuông để đánh dấu {isSingle ? 'đáp án đúng' : 'các đáp án đúng'}
          </span>
          <div className="space-y-2">
            {form.choices.map((choice, index) => (
              <div key={index} className={`flex items-center gap-2 rounded-lg border p-2 ${choice.isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
                <input
                  type={isSingle ? 'radio' : 'checkbox'}
                  name="correct-choice"
                  checked={choice.isCorrect}
                  onChange={() => toggleCorrect(index)}
                  aria-label={`Đánh dấu lựa chọn ${LETTERS[index]} là đáp án đúng`}
                  className="h-4 w-4 accent-emerald-600"
                />
                <b className="w-5 text-center text-slate-500">{LETTERS[index]}</b>
                <input
                  value={choice.content}
                  onChange={e => setChoice(index, { content: e.target.value })}
                  disabled={form.questionType === 'true_false'}
                  placeholder={`Lựa chọn ${LETTERS[index]}`}
                  className="flex-1 min-w-0 rounded border border-slate-200 px-2 h-9 text-sm bg-white"
                />
                {form.questionType !== 'true_false' && form.choices.length > 2 && (
                  <button type="button" onClick={() => removeChoice(index)} className="p-1 text-slate-400 hover:text-red-600" aria-label={`Xóa lựa chọn ${LETTERS[index]}`}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {form.questionType !== 'true_false' && form.choices.length < 6 && (
            <Button type="button" variant="ghost" onClick={() => setForm(prev => ({ ...prev, choices: [...prev.choices, { content: '', isCorrect: false }] }))}>
              <Plus size={15} /> Thêm lựa chọn
            </Button>
          )}
        </div>

        <label className="field">
          <span>Giải thích đáp án (hiện cho học viên sau khi nộp nếu được phép)</span>
          <textarea rows="2" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} />
        </label>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu câu hỏi'}</Button>
        </div>
      </form>
    </div>
  );
}
