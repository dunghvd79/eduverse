import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Clock3, PlayCircle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, Badge, PortalHeader } from '../../components/portal/PortalUI';
import quizService, { QUESTION_TYPE, formatDateTime, formatScore } from '../../services/quizService';
import { toast } from '../../components/common/Toast';

const LETTERS = 'ABCDEF';
const storageKey = (attemptId) => `eduverse:quiz-attempt:${attemptId}`;

// localStorage có thể bị chặn (chế độ riêng tư) -> bỏ qua, chỉ mất khả năng khôi phục khi tải lại trang
const loadSaved = (attemptId) => {
  try { return JSON.parse(localStorage.getItem(storageKey(attemptId))) || {}; } catch { return {}; }
};
const saveAnswers = (attemptId, answers) => {
  try { localStorage.setItem(storageKey(attemptId), JSON.stringify(answers)); } catch { /* bỏ qua */ }
};
const clearSaved = (attemptId) => {
  try { localStorage.removeItem(storageKey(attemptId)); } catch { /* bỏ qua */ }
};

const formatClock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ==========================================
// MÀN HÌNH GIỚI THIỆU (trước khi bắt đầu)
// ==========================================
function QuizIntro({ quiz, onStart, starting, onBack, lastAttemptId, onViewResult }) {
  return (
    <>
      <PortalHeader
        eyebrow="BÀI KIỂM TRA"
        title={quiz.title}
        desc={`${quiz.course?.title} · ${quiz.className || ''}`}
        actions={<Button variant="secondary" onClick={onBack}><ArrowLeft size={16} /> Về lớp học</Button>}
      />
      <Card>
        {quiz.description && <p className="mb-4 whitespace-pre-wrap text-slate-700">{quiz.description}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div><small className="block text-slate-500">Số câu hỏi</small><b className="text-lg">{quiz.totalQuestions}</b></div>
          <div><small className="block text-slate-500">Thời gian</small><b className="text-lg">{quiz.durationMinutes} phút</b></div>
          <div><small className="block text-slate-500">Điểm đạt</small><b className="text-lg">{formatScore(quiz.passScore)}/10</b></div>
          <div><small className="block text-slate-500">Lượt làm</small><b className="text-lg">{quiz.userAttemptsCount}/{quiz.maxAttempts}</b></div>
        </div>
        {(quiz.openTime || quiz.closeTime) && (
          <p className="text-sm text-slate-600 mb-3">Thời gian mở đề: {formatDateTime(quiz.openTime)} – {formatDateTime(quiz.closeTime)}</p>
        )}
        {quiz.bestScore !== null && (
          <p className="text-sm mb-3">Điểm cao nhất của bạn: <b>{formatScore(quiz.bestScore)}</b> <Badge tone={quiz.passed ? 'green' : 'red'}>{quiz.passed ? 'Đạt' : 'Chưa đạt'}</Badge></p>
        )}
        <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-5">
          <li>Đồng hồ tính giờ trên máy chủ, bắt đầu ngay khi bạn bấm "Bắt đầu". Hết giờ hệ thống tự nộp bài.</li>
          <li>Câu trả lời được lưu tạm trên trình duyệt, tải lại trang không bị mất.</li>
          <li>Câu nhiều đáp án phải chọn đúng và đủ mới được điểm.</li>
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          {quiz.isAvailable ? (
            <Button onClick={onStart} disabled={starting}>
              <PlayCircle size={17} /> {starting ? 'Đang chuẩn bị đề...' : quiz.inProgressAttemptId ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}
            </Button>
          ) : (
            <p className="flex items-center gap-2 text-amber-700 font-semibold"><AlertCircle size={18} /> {quiz.unavailableReason}</p>
          )}
          {lastAttemptId && <Button variant="secondary" onClick={onViewResult}>Xem kết quả gần nhất</Button>}
        </div>
      </Card>
    </>
  );
}

// ==========================================
// MÀN HÌNH LÀM BÀI
// ==========================================
export default function QuizTakePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const classId = params.get('classId');
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [lastAttemptId, setLastAttemptId] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const offsetRef = useRef(0); // lệch đồng hồ máy học viên so với server

  const backUrl = quiz?.classId ? `/student/classes/${quiz.classId}` : '/student/quizzes';

  // Lượt đã nộp gần nhất (trong lớp này) để xem lại kết quả từ màn hình giới thiệu
  useEffect(() => {
    if (!quiz?.userAttemptsCount) return;
    quizService.myAttempts(id, { sortBy: 'attemptNumber', sortOrder: 'DESC', limit: 50 })
      .then(data => setLastAttemptId((data.items || []).find(a => a.classId === quiz.classId && a.status !== 'in_progress')?.attemptId || null))
      .catch(() => {});
  }, [quiz?.classId, quiz?.userAttemptsCount]);

  useEffect(() => {
    quizService.get(id, classId)
      .then(setQuiz)
      .catch(error => {
        toast.error(error?.message || 'Không thể tải bài kiểm tra.');
        navigate('/student/quizzes', { replace: true });
      });
  }, [id, classId]);

  const start = async () => {
    try {
      setStarting(true);
      const data = await quizService.start(id, quiz.classId);
      offsetRef.current = new Date(data.serverTime).getTime() - Date.now();
      setAnswers(loadSaved(data.attemptId));
      setAttempt(data);
      if (data.resumed) toast.info('Tiếp tục lượt làm bài đang dở.');
    } catch (error) {
      toast.error(error?.message || 'Không thể bắt đầu làm bài.');
      quizService.get(id, quiz.classId).then(setQuiz).catch(() => {});
    } finally {
      setStarting(false);
    }
  };

  const submit = useCallback(async ({ auto = false } = {}) => {
    if (!attempt || submittedRef.current) return;
    if (!auto) {
      const unanswered = attempt.questions.filter(q => !(answers[q.id] || []).length).length;
      const message = unanswered
        ? `Bạn còn ${unanswered} câu chưa trả lời. Vẫn nộp bài?`
        : 'Nộp bài? Sau khi nộp bạn không thể sửa câu trả lời.';
      if (!window.confirm(message)) return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    const goToResult = () => navigate(`/student/quizzes/${id}/result/${attempt.attemptId}`, { replace: true });
    try {
      const result = await quizService.submit(attempt.attemptId, attempt.questions.map(q => ({ questionId: q.id, selectedChoiceIds: answers[q.id] || [] })));
      clearSaved(attempt.attemptId);
      toast.success(`${auto ? 'Hết giờ, hệ thống đã tự nộp bài. ' : ''}Điểm của bạn: ${formatScore(result.score)}/10`);
      goToResult();
    } catch (error) {
      // Đã nộp ở tab khác hoặc quá giờ -> bài đã được chốt trên server, chuyển sang trang kết quả
      if (error?.statusCode === 400) {
        clearSaved(attempt.attemptId);
        toast.error(error.message);
        goToResult();
        return;
      }
      submittedRef.current = false;
      setSubmitting(false);
      toast.error(error?.message || 'Không thể nộp bài, vui lòng thử lại.');
    }
  }, [attempt, answers, id, navigate]);

  // Đồng hồ đếm ngược theo giờ server; về 0 thì tự nộp
  useEffect(() => {
    if (!attempt) return undefined;
    const deadline = new Date(attempt.deadline).getTime();
    const tick = () => {
      const left = deadline - (Date.now() + offsetRef.current);
      setRemaining(left);
      if (left <= 0) submit({ auto: true });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [attempt, submit]);

  // Cảnh báo khi đóng tab / tải lại trang lúc đang làm bài
  useEffect(() => {
    if (!attempt) return undefined;
    const warn = (event) => { if (!submittedRef.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [attempt]);

  const choose = (question, choiceId) => {
    setAnswers(prev => {
      const selected = prev[question.id] || [];
      const nextSelected = question.questionType === 'multiple_choice'
        ? (selected.includes(choiceId) ? selected.filter(x => x !== choiceId) : [...selected, choiceId])
        : [choiceId];
      const next = { ...prev, [question.id]: nextSelected };
      saveAnswers(attempt.attemptId, next);
      return next;
    });
  };

  const answeredCount = useMemo(
    () => (attempt ? attempt.questions.filter(q => (answers[q.id] || []).length).length : 0),
    [attempt, answers]
  );

  if (!quiz) return <div className="p-10 text-center text-slate-500">Đang tải bài kiểm tra...</div>;
  if (!attempt) {
    return (
      <QuizIntro
        quiz={quiz}
        onStart={start}
        starting={starting}
        onBack={() => navigate(backUrl)}
        lastAttemptId={lastAttemptId}
        onViewResult={() => navigate(`/student/quizzes/${id}/result/${lastAttemptId}`)}
      />
    );
  }

  const question = attempt.questions[current];
  const selected = answers[question.id] || [];
  const lowTime = remaining !== null && remaining < 60 * 1000;

  return (
    <div className="quiz-shell">
      <div className="quiz-head">
        <div className="min-w-0">
          <Badge tone="purple">BÀI KIỂM TRA · LẦN {attempt.attemptNumber}</Badge>
          <h1 className="truncate">{attempt.quizTitle}</h1>
          <span>{attempt.questions.length} câu hỏi · {attempt.durationMinutes} phút · đã trả lời {answeredCount}/{attempt.questions.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`timer ${lowTime ? 'animate-pulse' : ''}`} role="timer" aria-live="off">
            <Clock3 size={16} className="inline mr-1 -mt-1" />{remaining === null ? '--:--' : formatClock(remaining)}
            <small>Còn lại</small>
          </div>
          {/* Bảng câu hỏi (có nút Nộp bài) bị ẩn trên mobile -> nút nộp riêng */}
          <span className="md:hidden"><Button variant="danger" onClick={() => submit()} disabled={submitting}>Nộp</Button></span>
        </div>
      </div>

      <div className="quiz-body">
        <section>
          <div className="question-card">
            <div className="question-meta">
              <b>Câu {current + 1} / {attempt.questions.length} · {QUESTION_TYPE[question.questionType]} · {formatScore(question.points)} điểm</b>
              <span>Đã lưu tạm ✓</span>
            </div>
            <h2 className="whitespace-pre-wrap">{question.content}</h2>
            {question.questionType === 'multiple_choice' && <p className="text-xs text-slate-500 -mt-3 mb-3">Chọn tất cả đáp án đúng.</p>}
            {question.choices.map((choice, i) => (
              <label key={choice.id} className={`answer ${selected.includes(choice.id) ? 'selected' : ''}`}>
                <input
                  type={question.questionType === 'multiple_choice' ? 'checkbox' : 'radio'}
                  name={`q-${question.id}`}
                  checked={selected.includes(choice.id)}
                  onChange={() => choose(question, choice.id)}
                />
                <b>{LETTERS[i]}</b>{choice.content}
              </label>
            ))}
            <div className="quiz-actions">
              <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← Câu trước</Button>
              {current < attempt.questions.length - 1
                ? <Button onClick={() => setCurrent(c => c + 1)}>Câu tiếp theo →</Button>
                : <Button variant="danger" onClick={() => submit()} disabled={submitting}>{submitting ? 'Đang nộp...' : 'Nộp bài'}</Button>}
            </div>
          </div>
        </section>

        <aside className="question-map">
          <b>Danh sách câu hỏi</b>
          <div>
            {attempt.questions.map((q, i) => {
              const done = (answers[q.id] || []).length > 0;
              return (
                <button
                  key={q.id}
                  className={i === current ? 'current' : ''}
                  style={done && i !== current ? { background: '#eaf8ef', borderColor: '#86efac' } : undefined}
                  onClick={() => setCurrent(i)}
                  aria-label={`Câu ${i + 1}${done ? ' (đã trả lời)' : ''}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="map-legend">Xanh lá: đã trả lời · {answeredCount}/{attempt.questions.length}</div>
          <Button variant="danger" onClick={() => submit()} disabled={submitting}>{submitting ? 'Đang nộp...' : 'Nộp bài'}</Button>
        </aside>
      </div>
    </div>
  );
}
