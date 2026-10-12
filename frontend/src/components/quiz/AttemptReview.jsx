import React from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { Card, Badge } from '../portal/PortalUI';
import { ATTEMPT_STATUS, QUESTION_TYPE, formatDateTime, formatScore } from '../../services/quizService';

const LETTERS = 'ABCDEF';

/**
 * Tổng quan điểm + từng câu hỏi của một lượt làm bài (GET /quiz-attempts/:attemptId).
 * Khi showAnswers = false (đề ẩn đáp án): chỉ hiện lựa chọn của học viên, không tô đúng/sai.
 */
export default function AttemptReview({ attempt }) {
  const [statusLabel, statusTone] = ATTEMPT_STATUS[attempt.status] || [attempt.status, 'gray'];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <div>
            <small className="block text-slate-500">Điểm (thang 10)</small>
            <div className={`text-4xl font-extrabold ${attempt.passed ? 'text-emerald-600' : 'text-red-600'}`}>{formatScore(attempt.score)}</div>
          </div>
          <div>
            <small className="block text-slate-500 mb-1">Kết quả</small>
            <Badge tone={attempt.passed ? 'green' : 'red'}>{attempt.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}</Badge>
            <small className="block text-slate-500 mt-1">Điểm đạt: {formatScore(attempt.passScore)}</small>
          </div>
          <div>
            <small className="block text-slate-500">Số câu đúng</small>
            <b className="text-lg">{attempt.showAnswers ? `${attempt.correctCount}/${attempt.totalQuestions}` : '—'}</b>
          </div>
          <div>
            <small className="block text-slate-500 mb-1">Trạng thái · Lần {attempt.attemptNumber}</small>
            <Badge tone={statusTone}>{statusLabel}</Badge>
          </div>
          <div>
            <small className="block text-slate-500">Nộp lúc</small>
            <span className="text-sm">{formatDateTime(attempt.submittedAt)}</span>
          </div>
        </div>
        {attempt.status === 'timed_out' && (
          <p className="mt-3 text-sm text-amber-700">Bài làm không được nộp trước khi hết giờ nên được tính 0 điểm.</p>
        )}
        {!attempt.showAnswers && (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <Info size={16} /> Giảng viên không công bố đáp án cho bài kiểm tra này. Bạn chỉ xem được lựa chọn của mình.
          </p>
        )}
      </Card>

      {attempt.questions.map((question, index) => {
        const selected = new Set(question.selectedChoiceIds || []);
        const correct = new Set(question.correctChoiceIds || []);
        return (
          <Card key={question.id}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <small className="font-semibold text-slate-500">Câu {index + 1} · {QUESTION_TYPE[question.questionType]} · {formatScore(question.points)} điểm</small>
              {attempt.showAnswers && (question.isCorrect
                ? <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600"><CheckCircle2 size={16} /> Đúng</span>
                : <span className="flex items-center gap-1 text-sm font-semibold text-red-600"><XCircle size={16} /> {selected.size ? 'Sai' : 'Chưa trả lời'}</span>)}
            </div>
            <p className="font-semibold mb-3 whitespace-pre-wrap">{question.content}</p>
            <div className="space-y-2">
              {question.choices.map((choice, i) => {
                const isSelected = selected.has(choice.id);
                const isRight = correct.has(choice.id);
                let tone = 'border-slate-200';
                if (attempt.showAnswers && isRight) tone = 'border-emerald-400 bg-emerald-50';
                else if (attempt.showAnswers && isSelected) tone = 'border-red-300 bg-red-50';
                else if (isSelected) tone = 'border-primary bg-blue-50';
                return (
                  <div key={choice.id} className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${tone}`}>
                    <b className="w-6 h-6 rounded-full bg-slate-100 grid place-items-center text-xs text-slate-600">{LETTERS[i]}</b>
                    <span className="flex-1">{choice.content}</span>
                    {isSelected && <Badge tone="blue">Bạn chọn</Badge>}
                    {attempt.showAnswers && isRight && <Badge tone="green">Đáp án đúng</Badge>}
                  </div>
                );
              })}
            </div>
            {attempt.showAnswers && question.explanation && (
              <div className="ai-tip !text-sm"><Info size={16} /><span>{question.explanation}</span></div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
