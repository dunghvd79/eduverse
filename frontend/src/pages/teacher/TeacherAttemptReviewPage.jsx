import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PortalHeader, Button } from '../../components/portal/PortalUI';
import AttemptReview from '../../components/quiz/AttemptReview';
import quizService from '../../services/quizService';
import { toast } from '../../components/common/Toast';

export default function TeacherAttemptReviewPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);

  useEffect(() => {
    quizService.attempt(attemptId)
      .then(setAttempt)
      .catch(error => toast.error(error?.message || 'Không thể tải bài làm.'));
  }, [attemptId]);

  if (!attempt) return <div className="p-10 text-center text-slate-500">Đang tải bài làm...</div>;

  return (
    <>
      <PortalHeader
        title={`${attempt.student?.fullName} — ${attempt.quizTitle}`}
        desc={`${attempt.student?.email} · ${attempt.className || ''}`}
        actions={<Button variant="secondary" onClick={() => navigate(`/teacher/quizzes/${attempt.quizId}?tab=results`)}><ArrowLeft size={16} /> Kết quả bài kiểm tra</Button>}
      />
      <AttemptReview attempt={attempt} />
    </>
  );
}
