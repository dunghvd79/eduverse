import React, { useEffect, useState } from 'react';
import { CheckCircle2, Pencil, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PortalHeader, Button, Card, SectionTitle, Badge, Field } from '../../components/portal/PortalUI';
import QuestionEditorModal from '../../components/quiz/QuestionEditorModal';
import quizService, { DIFFICULTY, QUESTION_TYPE } from '../../services/quizService';
import { toast } from '../../components/common/Toast';

const LETTERS = 'ABCDEF';
const MIN_WORDS = 100;
const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Sinh câu hỏi bằng Gemini (UC-AI-001 / SEQ-AI-001):
 * dán tài liệu -> AI sinh bản xem trước -> GV sửa / sinh lại từng câu / bỏ câu -> lưu hàng loạt vào đề.
 */
export default function AIQuizGeneratorPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [quizzes, setQuizzes] = useState([]);
  const [quizId, setQuizId] = useState(params.get('quizId') || '');
  const [form, setForm] = useState({ documentText: '', numQuestions: '5', difficulty: 'medium', questionType: 'single_choice' });
  const [questions, setQuestions] = useState([]);
  const [usedModel, setUsedModel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Chỉ lưu được vào đề của khóa học đang soạn (draft/rejected) mà mình sở hữu
  useEffect(() => {
    quizService.list({ limit: 100 })
      .then(data => setQuizzes((data.items || []).filter(q => ['draft', 'rejected'].includes(q.course?.status))))
      .catch(() => setQuizzes([]));
  }, []);

  const words = countWords(form.documentText);
  const set = (key) => (event) => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const generate = async () => {
    if (words < MIN_WORDS) {
      toast.error(`Tài liệu cần ít nhất ${MIN_WORDS} từ để AI có đủ dữ kiện (hiện có ${words} từ).`);
      return;
    }
    try {
      setGenerating(true);
      const data = await quizService.generate({ ...form, numQuestions: Number(form.numQuestions) });
      setQuestions(data.questions);
      setUsedModel(data.model || '');
      toast.success(data.totalGenerated < data.requested
        ? `AI sinh được ${data.totalGenerated}/${data.requested} câu hợp lệ.`
        : `AI đã sinh ${data.totalGenerated} câu hỏi. Hãy kiểm tra lại trước khi lưu.`);
    } catch (error) {
      toast.error(error?.errors?.[0] || error?.message || 'AI không sinh được câu hỏi, vui lòng thử lại.');
    } finally {
      setGenerating(false);
    }
  };

  const regenerate = async (question) => {
    try {
      setRegenerating(question.tempId);
      const data = await quizService.regenerate({
        documentText: form.documentText,
        previousQuestionPrompt: question.content,
        difficulty: form.difficulty,
        questionType: form.questionType === 'mixed' ? question.questionType : form.questionType
      });
      setQuestions(prev => prev.map(q => (q.tempId === question.tempId ? data.question : q)));
    } catch (error) {
      toast.error(error?.message || 'Không thể sinh lại câu hỏi.');
    } finally {
      setRegenerating(null);
    }
  };

  const save = async () => {
    if (!quizId) {
      toast.error('Vui lòng chọn bài kiểm tra để lưu câu hỏi.');
      return;
    }
    try {
      setSaving(true);
      const payload = questions.map(({ content, questionType, points, explanation, choices }) => ({
        content, questionType, points, explanation,
        choices: choices.map(({ content: c, isCorrect }) => ({ content: c, isCorrect }))
      }));
      const result = await quizService.bulkCreate(quizId, payload);
      toast.success(`Đã lưu ${result.insertedCount} câu hỏi vào bài kiểm tra.`);
      navigate(`/teacher/quizzes/${quizId}`);
    } catch (error) {
      toast.error(error?.message || 'Không thể lưu câu hỏi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PortalHeader eyebrow="AI ASSISTANT" title="Sinh câu hỏi bằng Gemini AI" desc="Dán nội dung bài giảng, AI soạn câu hỏi kèm đáp án và giải thích. Bạn xem lại, chỉnh sửa rồi mới lưu vào đề." />

      <div className="ai-layout">
        <Card>
          <div className="ai-title">
            <div className="ai-spark"><Sparkles /></div>
            <div><h2>Tài liệu & yêu cầu</h2><p>AI chỉ dùng kiến thức có trong tài liệu bạn cung cấp</p></div>
          </div>

          <Field label="Lưu vào bài kiểm tra">
            <select value={quizId} onChange={e => setQuizId(e.target.value)}>
              <option value="">— Chọn bài kiểm tra (khóa học đang soạn) —</option>
              {quizzes.map(q => <option key={q.id} value={q.id}>{q.course?.title} › {q.title}</option>)}
            </select>
          </Field>

          <label className="field">
            <span>Nội dung tài liệu / bài giảng</span>
            <textarea rows="10" value={form.documentText} onChange={set('documentText')} placeholder="Dán nội dung bài học, giáo trình hoặc slide (tối thiểu 100 từ)..." />
          </label>
          <small className={words < MIN_WORDS ? 'text-amber-700' : 'text-slate-500'}>{words} từ{words < MIN_WORDS ? ` — cần ít nhất ${MIN_WORDS} từ` : ''}</small>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Field label="Số câu (1-20)" type="number" min="1" max="20" value={form.numQuestions} onChange={set('numQuestions')} />
            <Field label="Độ khó">
              <select value={form.difficulty} onChange={set('difficulty')}>
                {Object.entries(DIFFICULTY).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Loại câu hỏi">
              <select value={form.questionType} onChange={set('questionType')}>
                {Object.entries(QUESTION_TYPE).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                <option value="mixed">Trộn nhiều loại</option>
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <Button onClick={generate} disabled={generating}>
              <Sparkles size={16} /> {generating ? 'AI đang soạn câu hỏi...' : questions.length ? 'Sinh lại toàn bộ' : 'Sinh câu hỏi bằng AI'}
            </Button>
          </div>
          <div className="ai-tip"><Sparkles size={16} /><span>Câu hỏi AI có thể sai. Luôn kiểm tra đáp án đúng trước khi lưu. Giới hạn 10 lần gọi AI mỗi phút.</span></div>
        </Card>

        <Card>
          <SectionTitle
            title={usedModel ? <>Xem trước <Badge tone="purple">{usedModel}</Badge></> : 'Xem trước'}
            action={questions.length ? (
              <Button onClick={save} disabled={saving || !quizId}><Save size={15} /> {saving ? 'Đang lưu...' : `Lưu ${questions.length} câu`}</Button>
            ) : null}
          />
          {questions.length === 0 ? (
            <p className="text-sm text-slate-500">{generating ? 'Gemini đang đọc tài liệu và soạn câu hỏi, thường mất 5–20 giây...' : 'Chưa có câu hỏi. Dán tài liệu và bấm "Sinh câu hỏi bằng AI".'}</p>
          ) : questions.map((question, index) => (
            <div className="ai-question" key={question.tempId}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>Câu {index + 1} · {QUESTION_TYPE[question.questionType]}</b>
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => setEditing(question)} aria-label="Sửa câu hỏi"><Pencil size={14} /></Button>
                  <Button variant="ghost" onClick={() => regenerate(question)} disabled={regenerating === question.tempId} aria-label="Sinh lại câu này">
                    <RefreshCw size={14} className={regenerating === question.tempId ? 'animate-spin' : ''} />
                  </Button>
                  <Button variant="ghost" onClick={() => setQuestions(prev => prev.filter(q => q.tempId !== question.tempId))} aria-label="Bỏ câu này"><Trash2 size={14} /></Button>
                </div>
              </div>
              <p>{question.content}</p>
              {question.choices.map((choice, i) => (
                <span key={choice.tempId || i} className={choice.isCorrect ? 'correct' : ''}>
                  {LETTERS[i]}. {choice.content} {choice.isCorrect && <CheckCircle2 size={13} className="inline" aria-label="Đáp án đúng" />}
                </span>
              ))}
              {question.explanation && <small className="block text-slate-500 mt-1">💡 {question.explanation}</small>}
            </div>
          ))}
          {questions.length > 0 && !quizId && <Badge tone="orange">Chọn bài kiểm tra ở cột trái để lưu</Badge>}
        </Card>
      </div>

      {editing && (
        <QuestionEditorModal
          question={editing}
          title="Sửa câu hỏi AI"
          onSave={async (payload) => {
            setQuestions(prev => prev.map(q => (q.tempId === editing.tempId ? { ...q, ...payload } : q)));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
