import React, { useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalHeader, Button, Card, SectionTitle, Table, Badge } from '../../components/portal/PortalUI';
import AttemptReview from '../../components/quiz/AttemptReview';
import quizService, { ATTEMPT_STATUS, formatDateTime, formatScore } from '../../services/quizService';
import { toast } from '../../components/common/Toast';

export default function QuizResultPage() {
  const { id, attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await quizService.attempt(attemptId);
        if (cancelled) return;
        setAttempt(detail);
        const [info, mine] = await Promise.all([
          quizService.get(id, detail.classId),
          quizService.myAttempts(id, { sortBy: 'attemptNumber', sortOrder: 'DESC', limit: 50 })
        ]);
        if (!cancelled) {
          setQuiz(info);
          setHistory((mine.items || []).filter(a => a.classId === detail.classId));
        }
      } catch (error) {
        if (!cancelled) toast.error(error?.message || 'Không thể tải kết quả.');
      }
    })();
    return () => { cancelled = true; };
  }, [id, attemptId]);

  if (!attempt) return <div className="p-10 text-center text-slate-500">Đang tải kết quả...</div>;

  const takeUrl = `/student/quizzes/${id}/take?classId=${attempt.classId}`;

  return (
    <>
      <PortalHeader
        eyebrow="QUIZ RESULT"
        title={attempt.quizTitle}
        desc={`${attempt.className || ''} · Lần làm thứ ${attempt.attemptNumber}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/student/classes/${attempt.classId}`)}><ArrowLeft size={16} /> Về lớp học</Button>
            {quiz?.isAvailable && (
              <Button onClick={() => navigate(takeUrl)}><RotateCcw size={15} /> {quiz.inProgressAttemptId ? 'Tiếp tục lượt đang làm' : `Làm lại (còn ${quiz.remainingAttempts} lượt)`}</Button>
            )}
          </>
        }
      />

      {history.length > 1 && (
        <Card>
          <SectionTitle title="Các lần làm bài" action={quiz?.bestScore !== null && quiz?.bestScore !== undefined ? <Badge tone="green">Cao nhất: {formatScore(quiz.bestScore)}</Badge> : null} />
          <Table
            headers={['Lần', 'Điểm', 'Kết quả', 'Trạng thái', 'Nộp lúc', '']}
            rows={history.map(item => {
              const [label, tone] = ATTEMPT_STATUS[item.status] || [item.status, 'gray'];
              return [
                item.attemptNumber,
                <b>{formatScore(item.score)}</b>,
                item.status === 'in_progress' ? '—' : <Badge tone={item.passed ? 'green' : 'red'}>{item.passed ? 'Đạt' : 'Chưa đạt'}</Badge>,
                <Badge tone={tone}>{label}</Badge>,
                <span className="text-xs">{formatDateTime(item.submittedAt)}</span>,
                item.attemptId === attempt.attemptId || item.status === 'in_progress'
                  ? (item.attemptId === attempt.attemptId ? <small className="text-slate-400">Đang xem</small> : null)
                  : <Button variant="ghost" onClick={() => navigate(`/student/quizzes/${id}/result/${item.attemptId}`)}>Xem</Button>
              ];
            })}
          />
        </Card>
      )}

      <AttemptReview attempt={attempt} />
    </>
  );
}
