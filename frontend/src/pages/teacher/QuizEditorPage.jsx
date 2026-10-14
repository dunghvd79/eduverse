import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Lock, Pencil, Plus,
  Search, Settings2, Sparkles, Trash2, Users
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PortalHeader, Button, Card, Table, Badge, StatCard } from '../../components/portal/PortalUI';
import QuestionEditorModal from '../../components/quiz/QuestionEditorModal';
import QuizFormModal from '../../components/quiz/QuizFormModal';
import quizService, { ATTEMPT_STATUS, QUESTION_TYPE, formatDateTime, formatScore } from '../../services/quizService';
import { toast } from '../../components/common/Toast';
import { confirmModal } from '../../components/common/ConfirmModal';

const LETTERS = 'ABCDEF';

// ==========================================
// TAB: CÂU HỎI
// ==========================================
function QuestionsTab({ quiz, canEdit, onChanged }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | question
  const [selected, setSelected] = useState(new Set());

  const load = async () => {
    try {
      setLoading(true);
      setQuestions(await quizService.questions(quiz.id));
      setSelected(new Set());
    } catch (error) {
      toast.error(error?.message || 'Không thể tải câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [quiz.id]);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const refresh = async () => { await load(); onChanged(); };

  const saveQuestion = async (payload) => {
    if (editing === 'new') {
      await quizService.createQuestion(quiz.id, payload);
      toast.success('Đã thêm câu hỏi.');
    } else {
      await quizService.updateQuestion(editing.id, payload);
      toast.success('Đã cập nhật câu hỏi.');
    }
    setEditing(null);
    await refresh();
  };

  const move = async (index, delta) => {
    const next = [...questions];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setQuestions(next);
    try {
      await quizService.reorder(quiz.id, next.map((q, i) => ({ id: q.id, orderIndex: i + 1 })));
    } catch (error) {
      toast.error(error?.message || 'Không thể đổi thứ tự.');
      load();
    }
  };

  const removeOne = async (question) => {
    const ok = await confirmModal({
      title: 'Xóa câu hỏi?',
      message: 'Bạn có chắc chắn muốn xóa câu hỏi này khỏi bài kiểm tra?',
      subtext: 'Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa câu hỏi',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await quizService.deleteQuestion(question.id);
      toast.success('Đã xóa câu hỏi.');
      refresh();
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa câu hỏi.');
    }
  };

  const removeSelected = async () => {
    const ok = await confirmModal({
      title: 'Xóa các câu hỏi đã chọn?',
      message: `Bạn có chắc chắn muốn xóa ${selected.size} câu hỏi đang chọn?`,
      subtext: 'Các câu hỏi đã chọn sẽ bị xóa vĩnh viễn khỏi bài kiểm tra này.',
      confirmText: 'Xóa câu hỏi đã chọn',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await quizService.bulkDelete(quiz.id, [...selected]);
      toast.success(`Đã xóa ${selected.size} câu hỏi.`);
      refresh();
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa câu hỏi.');
    }
  };

  const setPointsSelected = async () => {
    const value = window.prompt(`Nhập điểm chung cho ${selected.size} câu hỏi đã chọn:`, '1');
    if (value === null) return;
    const points = Number(value.replace(',', '.'));
    if (!(points > 0)) {
      toast.error('Điểm phải là số lớn hơn 0.');
      return;
    }
    try {
      await quizService.setCommonPoints(quiz.id, [...selected], points);
      toast.success('Đã cập nhật điểm.');
      refresh();
    } catch (error) {
      toast.error(error?.message || 'Không thể cập nhật điểm.');
    }
  };

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (loading) return <Card><div className="p-6 text-center text-slate-500">Đang tải câu hỏi...</div></Card>;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-sm text-slate-600">{questions.length} câu hỏi · tổng {formatScore(totalPoints)} điểm (quy đổi về thang 10 khi chấm)</span>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {selected.size > 0 && (
              <>
                <Button variant="secondary" onClick={setPointsSelected}>Gán điểm ({selected.size})</Button>
                <Button variant="secondary" onClick={removeSelected}><Trash2 size={15} /> Xóa ({selected.size})</Button>
              </>
            )}
            <Button variant="secondary" onClick={() => navigate(`/teacher/quizzes/ai-generator?quizId=${quiz.id}`)}><Sparkles size={15} /> Sinh bằng AI</Button>
            <Button onClick={() => setEditing('new')}><Plus size={16} /> Thêm câu hỏi</Button>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-slate-500">
            Đề chưa có câu hỏi. {canEdit && 'Thêm thủ công hoặc dùng Gemini AI để sinh câu hỏi từ tài liệu bài giảng.'}
          </div>
        </Card>
      ) : questions.map((question, index) => (
        <Card key={question.id}>
          <div className="flex items-start gap-3">
            {canEdit && (
              <input type="checkbox" className="mt-1.5 h-4 w-4" checked={selected.has(question.id)} onChange={() => toggle(question.id)} aria-label={`Chọn câu ${index + 1}`} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <b className="text-sm">Câu {index + 1}</b>
                <Badge tone="purple">{QUESTION_TYPE[question.questionType]}</Badge>
                <small className="text-slate-500">{formatScore(question.points)} điểm</small>
              </div>
              <p className="font-semibold whitespace-pre-wrap mb-2">{question.content}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {question.choices.map((choice, i) => (
                  <div key={choice.id} className={`text-sm rounded px-2 py-1 ${choice.isCorrect ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                    {LETTERS[i]}. {choice.content} {choice.isCorrect && <CheckCircle2 size={14} className="inline" aria-label="Đáp án đúng" />}
                  </div>
                ))}
              </div>
              {question.explanation && <p className="text-xs text-slate-500 mt-2">💡 {question.explanation}</p>}
            </div>
            {canEdit && (
              <div className="flex flex-col gap-1">
                <Button variant="ghost" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Lên trên"><ArrowUp size={15} /></Button>
                <Button variant="ghost" disabled={index === questions.length - 1} onClick={() => move(index, 1)} aria-label="Xuống dưới"><ArrowDown size={15} /></Button>
                <Button variant="ghost" onClick={() => setEditing(question)} aria-label="Sửa câu hỏi"><Pencil size={15} /></Button>
                <Button variant="ghost" onClick={() => removeOne(question)} aria-label="Xóa câu hỏi"><Trash2 size={15} /></Button>
              </div>
            )}
          </div>
        </Card>
      ))}

      {editing && (
        <QuestionEditorModal
          question={editing === 'new' ? null : editing}
          onSave={saveQuestion}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

// ==========================================
// TAB: KẾT QUẢ
// ==========================================
function ResultsTab({ quiz }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [passed, setPassed] = useState('');
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('submittedAt:DESC');
  const classId = params.get('classId');

  useEffect(() => {
    const timer = setTimeout(() => { setKeyword(search.trim()); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const [sortBy, sortOrder] = sort.split(':');
    quizService.attempts(quiz.id, {
      page, limit: 20, sortBy, sortOrder,
      ...(passed ? { passed } : {}), ...(keyword ? { search: keyword } : {}), ...(classId ? { classId } : {})
    })
      .then(setData)
      .catch(error => toast.error(error?.message || 'Không thể tải kết quả.'));
  }, [quiz.id, page, passed, keyword, sort, classId]);

  const summary = data?.summary;
  return (
    <>
      {summary && (
        <div className="stats-grid">
          <StatCard icon={Users} label="Học viên đã làm" value={summary.studentsAttempted} sub={`${summary.totalAttempts} lượt làm`} />
          <StatCard icon={CheckCircle2} label="Học viên đạt" value={summary.passedStudents} />
          <StatCard icon={CheckCircle2} label="Điểm TB (cao nhất mỗi HV)" value={formatScore(summary.averageBestScore)} />
        </div>
      )}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="tabs">
            {[['', 'Tất cả'], ['true', 'Đạt'], ['false', 'Chưa đạt']].map(([value, label]) => (
              <button key={value || 'all'} className={`tab ${passed === value ? 'active' : ''}`} onClick={() => { setPassed(value); setPage(1); }}>{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="h-9 rounded-lg border border-slate-200 px-2 text-sm bg-white" aria-label="Sắp xếp">
              <option value="submittedAt:DESC">Nộp gần đây</option>
              <option value="score:DESC">Điểm cao trước</option>
              <option value="score:ASC">Điểm thấp trước</option>
              <option value="studentName:ASC">Tên A → Z</option>
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-9 w-full md:w-56">
              <Search size={15} className="text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm học viên..." className="flex-1 min-w-0 text-sm outline-none" />
            </label>
          </div>
        </div>
        {!data ? (
          <div className="p-6 text-center text-slate-500">Đang tải kết quả...</div>
        ) : data.items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Chưa có lượt làm bài phù hợp.</div>
        ) : (
          <Table
            headers={['Học viên', 'Lớp', 'Lần', 'Điểm', 'Kết quả', 'Trạng thái', 'Nộp lúc', '']}
            rows={data.items.map(item => {
              const [label, tone] = ATTEMPT_STATUS[item.status] || [item.status, 'gray'];
              return [
                <div><b>{item.student.fullName}</b><div className="text-xs text-slate-500">{item.student.email}</div></div>,
                item.class.name,
                item.attemptNumber,
                <b>{formatScore(item.score)}</b>,
                item.status === 'in_progress' ? '—' : <Badge tone={item.passed ? 'green' : 'red'}>{item.passed ? 'Đạt' : 'Chưa đạt'}</Badge>,
                <Badge tone={tone}>{label}</Badge>,
                <span className="text-xs">{formatDateTime(item.submittedAt)}</span>,
                item.status === 'in_progress' ? null : <Button variant="ghost" onClick={() => navigate(`/teacher/quiz-attempts/${item.attemptId}`)}>Xem bài</Button>
              ];
            })}
          />
        )}
        {data?.meta?.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-4">
            <small className="text-slate-500">Trang {data.meta.page}/{data.meta.totalPages}</small>
            <Button variant="secondary" disabled={!data.meta.hasPreviousPage} onClick={() => setPage(p => p - 1)} aria-label="Trang trước"><ChevronLeft size={15} /></Button>
            <Button variant="secondary" disabled={!data.meta.hasNextPage} onClick={() => setPage(p => p + 1)} aria-label="Trang sau"><ChevronRight size={15} /></Button>
          </div>
        )}
      </Card>
    </>
  );
}

// ==========================================
// TRANG SOẠN ĐỀ
// ==========================================
export default function QuizEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [quiz, setQuiz] = useState(null);
  const [tab, setTab] = useState(params.get('tab') === 'results' ? 'results' : 'questions');
  const [showSettings, setShowSettings] = useState(false);

  const load = async () => {
    try {
      setQuiz(await quizService.get(id));
    } catch (error) {
      toast.error(error?.message || 'Không thể tải bài kiểm tra.');
      if (error?.statusCode === 404) navigate('/teacher/quizzes', { replace: true });
    }
  };

  useEffect(() => { load(); }, [id]);

  const lockReason = useMemo(() => {
    if (!quiz || quiz.canEdit) return null;
    if (quiz.course?.status === 'pending') return 'Khóa học đang chờ duyệt nên đề thi tạm khóa chỉnh sửa.';
    if (quiz.course?.status === 'published') return 'Khóa học đã công khai nên đề thi chỉ xem được. Lịch mở đề cho từng lớp chỉnh trong trang Lớp học.';
    return 'Bạn chỉ có quyền xem đề này (không phải chủ khóa học).';
  }, [quiz]);

  if (!quiz) return <div className="p-10 text-center text-slate-500">Đang tải bài kiểm tra...</div>;

  const togglePublish = async () => {
    try {
      const updated = await quizService.update(quiz.id, { isPublished: !quiz.isPublished });
      setQuiz(prev => ({ ...prev, ...updated }));
      toast.success(updated.isPublished ? 'Đã công khai bài kiểm tra.' : 'Đã chuyển bài kiểm tra về nháp.');
    } catch (error) {
      toast.error(error?.message || 'Không thể đổi trạng thái.');
    }
  };

  const deleteQuiz = async () => {
    const ok = await confirmModal({
      title: 'Xác nhận xóa bài kiểm tra?',
      message: `Bạn có chắc chắn muốn xóa bài kiểm tra "${quiz.title}"?`,
      subtext: 'Toàn bộ câu hỏi, đáp án và lịch sử làm bài kiểm tra sẽ bị xóa hoàn toàn.',
      confirmText: 'Xóa bài kiểm tra',
      cancelText: 'Hủy bỏ',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await quizService.remove(quiz.id);
      toast.success('Đã xóa bài kiểm tra.');
      navigate('/teacher/quizzes', { replace: true });
    } catch (error) {
      toast.error(error?.message || 'Không thể xóa bài kiểm tra.');
    }
  };

  return (
    <>
      <PortalHeader
        title={quiz.title}
        desc={`${quiz.course?.title} › ${quiz.lessonTitle} · ${quiz.durationMinutes} phút · tối đa ${quiz.maxAttempts} lần · điểm đạt ${formatScore(quiz.passScore)}/10 · ${quiz.showAnswersAfterSubmit ? 'cho xem đáp án' : 'ẩn đáp án'}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/teacher/quizzes')}><ArrowLeft size={16} /> Danh sách</Button>
            {quiz.canEdit && (
              <>
                <Button variant="secondary" onClick={() => setShowSettings(true)}><Settings2 size={15} /> Cấu hình</Button>
                <Button variant="secondary" onClick={togglePublish}>
                  {quiz.isPublished ? <><EyeOff size={15} /> Chuyển về nháp</> : <><Eye size={15} /> Công khai</>}
                </Button>
                <Button variant="danger" onClick={deleteQuiz}><Trash2 size={15} /> Xóa</Button>
              </>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge tone={quiz.isPublished ? 'green' : 'gray'}>{quiz.isPublished ? 'Đề đã công khai' : 'Đề nháp — học viên chưa thấy'}</Badge>
        {lockReason && (
          <span className="flex items-center gap-1.5 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <Lock size={14} /> {lockReason}
          </span>
        )}
      </div>

      <div className="tabs-card">
        <button className={`tab ${tab === 'questions' ? 'active' : ''}`} onClick={() => setTab('questions')}>Câu hỏi ({quiz.totalQuestions})</button>
        <button className={`tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>Kết quả học viên</button>
      </div>

      {tab === 'questions'
        ? <QuestionsTab quiz={quiz} canEdit={quiz.canEdit} onChanged={load} />
        : <ResultsTab quiz={quiz} />}

      {showSettings && (
        <QuizFormModal
          quiz={quiz}
          onClose={() => setShowSettings(false)}
          onSaved={(updated) => { setShowSettings(false); setQuiz(prev => ({ ...prev, ...updated })); }}
        />
      )}
    </>
  );
}
