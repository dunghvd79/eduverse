import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PortalHeader, Card, Table, Badge, Button } from '../../components/portal/PortalUI';
import classService from '../../services/classService';
import quizService, { formatDateTime, formatScore } from '../../services/quizService';
import { toast } from '../../components/common/Toast';

/**
 * Trạng thái hiển thị của 1 đề với học viên
 */
export const quizStatus = (quiz) => {
  if (quiz.inProgressAttemptId) return ['Đang làm dở', 'blue'];
  if (quiz.passed) return ['Đã đạt', 'green'];
  if (quiz.userAttemptsCount > 0 && quiz.remainingAttempts === 0) return ['Chưa đạt · hết lượt', 'red'];
  if (quiz.userAttemptsCount > 0) return ['Chưa đạt', 'orange'];
  if (!quiz.isAvailable) return [quiz.unavailableReason || 'Chưa mở', 'gray'];
  return ['Chưa làm', 'purple'];
};

/**
 * Bảng đề thi của một lớp cho học viên (dùng ở trang này và trang chi tiết lớp)
 */
export function StudentQuizTable({ classId, quizzes }) {
  const navigate = useNavigate();
  if (!quizzes.length) return <p className="text-sm text-slate-500">Lớp chưa có bài kiểm tra nào được công khai.</p>;
  return (
    <Table
      headers={['Bài kiểm tra', 'Thời gian', 'Hạn làm', 'Lượt', 'Điểm cao nhất', 'Trạng thái', '']}
      rows={quizzes.map(quiz => {
        const [label, tone] = quizStatus(quiz);
        return [
          <div><b>{quiz.title}</b><div className="text-xs text-slate-500">{quiz.lessonTitle} · {quiz.totalQuestions} câu</div></div>,
          `${quiz.durationMinutes} phút`,
          <span className="text-xs">{quiz.closeTime ? formatDateTime(quiz.closeTime) : 'Không giới hạn'}</span>,
          `${quiz.userAttemptsCount}/${quiz.maxAttempts}`,
          quiz.bestScore === null ? '—' : <b>{formatScore(quiz.bestScore)}</b>,
          <Badge tone={tone}>{label}</Badge>,
          quiz.isAvailable
            ? <Button variant="ghost" onClick={() => navigate(`/student/quizzes/${quiz.id}/take?classId=${classId}`)}>{quiz.inProgressAttemptId ? 'Tiếp tục' : quiz.userAttemptsCount ? 'Làm lại' : 'Làm bài'}</Button>
            : (quiz.userAttemptsCount > 0
              ? <Button variant="ghost" onClick={() => navigate(`/student/quizzes/${quiz.id}/take?classId=${classId}`)}>Chi tiết</Button>
              : null)
        ];
      })}
    />
  );
}

export default function StudentQuizzesPage() {
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const classes = await classService.myClasses();
        const lists = await Promise.all(classes.map(cls => quizService.classQuizzes(cls.id).catch(() => [])));
        setGroups(classes.map((cls, i) => ({ cls, quizzes: lists[i] })));
      } catch (error) {
        toast.error(error?.message || 'Không thể tải bài kiểm tra.');
        setGroups([]);
      }
    })();
  }, []);

  const pending = useMemo(
    () => (groups || []).reduce((sum, g) => sum + g.quizzes.filter(q => q.isAvailable && !q.passed).length, 0),
    [groups]
  );

  return (
    <>
      <PortalHeader title="Bài kiểm tra" desc={groups ? `${pending} bài kiểm tra đang chờ bạn hoàn thành.` : 'Bài kiểm tra trắc nghiệm của các lớp bạn đang học.'} />
      {!groups ? (
        <div className="p-10 text-center text-slate-500">Đang tải bài kiểm tra...</div>
      ) : groups.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <ClipboardCheck className="mx-auto mb-3 text-slate-500" size={32} />
            <p className="text-slate-500">Bạn chưa tham gia lớp học nào.</p>
          </div>
        </Card>
      ) : groups.map(({ cls, quizzes }) => (
        <Card key={cls.id}>
          <h2 className="font-bold mb-1">{cls.course?.title}</h2>
          <p className="text-sm text-slate-500 mb-3">{cls.name}</p>
          <StudentQuizTable classId={cls.id} quizzes={quizzes} />
        </Card>
      ))}
    </>
  );
}
